import File from './File';

export default class Package extends File {

  async templateRepo() {
    const content = await this.originalContent({
      ignoreMissing: true
    });
    const pkg = JSON.parse(content);
    if (pkg.template !== undefined && pkg.template.repository !== undefined) {
      const m = pkg.template.repository.url.match(/github.com\/(.*)\.git$/);
      return m[1];
    }

    return undefined;
  }

  get merge() {
    return Promise.all([this.originalContent({
      ignoreMissing: true
    }), this.templateContent()]).then(contents => {
      const original = contents[0];
      let target = contents[0] === undefined || contents[0] === '' ? {} : JSON.parse(contents[0]);
      const template = JSON.parse(contents[1]);
      const messages = [];

      const properties = this.context.properties;

      if (target.name === undefined || target.name === '') {
        const m = this.context.targetRepo.match(/^([^\/]+)\/(.*)/);
        target.name = m ? m[2] : this.context.targetRepo;
      }

      if (target.module !== undefined && !target.module.match(/\{\{module\}\}/)) {
        properties.module = target.module;
      }

      properties.main = target.main && !target.main.match(/\{\{main\}\}/) ? target.main : 'dist/index.js';

      let extraBuild, buildOutput;

      if (target.scripts !== undefined) {
        [target.scripts.build, target.scripts.prepublish].filter(s => s !== undefined).forEach(script => {
          const ma = script.match(/--output=([^\s]+)/);
          if (ma) {
            buildOutput = ma[1];
          }

          const mb = script.match(/&&\s*(.+)/);
          if (mb) {
            extraBuild = mb[1];
          }
        });

        delete target.scripts.build;
      }

      const deepPropeties = {
        scripts: {},
        devDependencies: {},
        engines: {}
      };

      Object.keys(deepPropeties).forEach(p => {
        if (target[p] === undefined) {
          target[p] = {};
        }

        if (template[p] !== undefined) {
          Object.keys(template[p]).forEach(d => {
            if (template[p][d] === '-') {
              if (target[p][d] !== undefined) {
                messages.push(`chore(${p}): remove ${d}@${target[p][d]}`);
                delete target[p][d];
              }
            } else {
              const tp = this.context.expand(template[p][d]);
              if (tp !== target[p][d]) {
                messages.push(target[p][d] === undefined ? `chore(${p}): add ${d}@${tp} from template` :
                  `chore(${p}): update ${d}@${tp} from template`);
                target[p][d] = tp;
              }
            }
          });
        }
      });

      Object.keys(template).forEach(p => {
        if (p !== 'template') {
          if (target[p] === undefined) {
            target[p] = template[p];
          }
        }
      });

      if (target.scripts.prepublish) {
        if (buildOutput !== undefined) {
          target.scripts.prepublish = target.scripts.prepublish.replace(/--output=([^\s]+)/,
            `--output=${buildOutput}`);
        }
        if (extraBuild !== undefined) {
          target.scripts.prepublish += ` && ${extraBuild}`;
        }
      }

      if (target.module === '{{module}}') {
        delete target.module;
      }

      if (target.contributors !== undefined && target.author !== undefined && target.author.name !== undefined) {
        const m = target.author.name.match(/(^[^<]+)<([^>]+)>/);
        if (m !== undefined) {
          const name = String(m[1]).replace(/^\s+|\s+$/g, '');
          const email = m[2];

          if (target.contributors.find(c => c.name === name && c.email === email)) {
            delete target.author;
          }
        }
      }

      if (target.keywords !== undefined) {
        delete target.keywords['npm-package-template'];
      }

      if (template.template !== undefined && template.template.keywords !== undefined) {
        Object.keys(template.template.keywords).forEach(r =>
          addKeyword(target, new RegExp(r), template.template.keywords[r], messages)
        );
      }

      if (target.template === undefined || target.template.repository === undefined ||
        target.template.repository.url !== `https://github.com/${this.context.templateRepo}.git`) {
        messages.push('chore: set template repo');

        target.template = {
          repository: {
            url: `https://github.com/${this.context.templateRepo}.git`
          }
        };
      }

      const rcj = this.context.files.get('rollup.config.js');
      const first = rcj === undefined ? Promise.resolve() :
        rcj.merge.then(m => {
          if (m.content) {
            if (!m.content.match(/rollup-plugin-node-resolve/)) {
              delete target.devDependencies['rollup-plugin-node-resolve'];
            }
            if (!m.content.match(/rollup-plugin-commonjs/)) {
              delete target.devDependencies['rollup-plugin-commonjs'];
            }
          }
        });

      target = deleter(target, template, messages, []);

      if (messages.length === 0) {
        messages.push('chore: update package.json from template');
      }

      return first.then(() => {
        const content = JSON.stringify(this.context.expand(target), undefined, 2);
        return {
          content,
          messages,
          path: this.path,
            changed: original !== content
        };
      });
    });
  }
}

function deleter(object, reference, messages, path) {
  if (typeof object === 'string' || object instanceof String ||
    object === true || object === false || object === undefined || object === null ||
    typeof object === 'number' || object instanceof Number) {
    return object;
  }

  Object.keys(reference).forEach(key => {
    path.push(key);

    if (reference[key] === '--delete--') {
      delete object[key];
      messages.push(`chore(npm): delete ${path.join('.')}`);
    } else {
      object[key] = deleter(object[key], reference[key], messages, path);
    }
    path.pop();
  });

  return object;
}

function addKeyword(pkg, regex, keyword, messages) {
  if (pkg.name.match(regex)) {
    if (pkg.keywords === undefined) {
      pkg.keywords = [];
    }
    if (!pkg.keywords.find(k => k === keyword)) {
      messages.push(`docs(package): add keyword ${keyword}`);
      pkg.keywords.push(keyword);
    }
  }
}
