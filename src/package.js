import { File } from './file';
const diff = require('simple-diff');
const jp = require('jsonpath');

function moduleNames(object) {
  if (object === undefined) return new Set();

  const modules = new Set();

  Object.keys(object).forEach(k => {
    const v = object[k];
    if (typeof v === 'string') {
      modules.add(v);
    } else if (Array.isArray(v)) {
      v.forEach(e => {
        if (typeof e === 'string') {
          modules.add(e);
        }
      });
    }
  });

  return modules;
}

/**
 * order in which json keys are written
 */
const sortedKeys = [
  'name',
  'version',
  'private',
  'publishConfig',
  'main',
  'browser',
  'module',
  'description',
  'keywords',
  'author',
  'contributors',
  'license',
  'bin',
  'scripts',
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'engines',
  'repository',
  'bugs',
  'homepage',
  'release',
  'ava',
  'nyc',
  'xo',
  'template'
];

/**
 * Merger for package.json
 */
export class Package extends File {
  static decodeScripts(scripts) {
    const decoded = {};

    if (scripts !== undefined) {
      Object.keys(scripts).forEach(key => {
        const script = scripts[key];
        decoded[key] = script.split(/\s*&&\s*/);
      });
    }

    return decoded;
  }

  static get defaultOptions() {
    return {
      actions: [],
      keywords: []
    };
  }

  static matchesFileName(name) {
    return name.match(/^package\.json$/);
  }

  optionalDevModules(modules = new Set()) {
    return new Set(['cracks', 'dont-crack'].filter(m => modules.has(m)));
  }

  async usedDevModules(content) {
    content = await content;

    const pkg = content.length === 0 ? {} : JSON.parse(content);

    return moduleNames(pkg.release);
  }

  /**
   * Deliver some key properties
   * @param {Branch} branch
   * @return {Object}
   */
  async properties(branch) {
    try {
      const content = await branch.content(this.path);
      const pkg = JSON.parse(content.content);

      const properties = {
        npm: { name: pkg.name, fullName: pkg.name }
      };

      if (pkg.name !== undefined) {
        const m = pkg.name.match(/^(\@[^\/]+)\/(.*)/);
        if (m) {
          properties.npm.organization = m[1];
          properties.npm.name = m[2];
        }
      }

      if (pkg.template !== undefined && pkg.template.repository !== undefined) {
        properties.templateRepo = pkg.template.repository.url;
      }

      ['description', 'name', 'module', 'browser'].forEach(key => {
        if (pkg[key] !== undefined && pkg[key] !== `{{${key}}}`) {
          properties[key] = pkg[key];
        }
      });

      return properties;
    } catch (e) {}

    return {};
  }

  async mergeContent(context, original, templateContent) {
    const originalLastChar = original[original.length - 1];
    const originalTemplate = JSON.parse(templateContent);

    const targetRepository = context.targetBranch.repository;

    let target =
      original === undefined || original === '' ? {} : JSON.parse(original);

    const template = Object.assign({}, originalTemplate, {
      repository: {
        type: targetRepository.type,
        url: targetRepository.url
      },
      bugs: {
        url: context.targetBranch.issuesURL
      },
      homepage: context.targetBranch.homePageURL,
      template: {
        repository: {
          url: context.templateBranch.url
        }
      }
    });
    template.template = Object.assign({}, target.template, template.template);

    let messages = [];
    const properties = context.properties;

    if (target.name === undefined || target.name === '') {
      const m = targetRepository.name.match(/^([^\/]+)\/(.*)/);
      target.name = m ? m[2] : context.targetBranch.name;
    }

    if (target.module !== undefined && !target.module.match(/\{\{module\}\}/)) {
      properties.module = target.module;
    }

    properties.main =
      target.main && !target.main.match(/\{\{main\}\}/)
        ? target.main
        : 'dist/index.js';

    const slots = {
      repository: 'chore(package): correct repository url',
      bugs: 'chore(package): correct bugs url',
      homepage: 'chore(package): homepage',
      template: 'chore(package): set template repo'
    };
    Object.keys(slots).forEach(key => {
      if (diff(target[key], template[key]).length > 0) {
        messages.push(slots[key]);
        target[key] = template[key];
      }
    });

    const extraBuilds = {};

    if (target.scripts !== undefined) {
      Object.keys(target.scripts).forEach(key => {
        const script = target.scripts[key];

        if (template.scripts !== undefined) {
          const templateScript = template.scripts[key];
          if (templateScript !== undefined) {
            //const parts = script.split(/\s*&&\s*/);
            const mb = script.match(/&&\s*(.+)$/);
            if (mb && !templateScript.includes(mb[1])) {
              extraBuilds[key] = mb[1];
            }
          }
        }
      });
    }

    const usedDevModules = await context.usedDevModules();

    context.debug(`usedDevModules: ${Array.from(usedDevModules).join(',')}`);

    const optionalDevModules = context.optionalDevModules(usedDevModules);

    context.debug(
      `optionalDevModules: ${Array.from(optionalDevModules).join(',')}`
    );

    const deepProperties = {
      devDependencies: { merge: defaultMerge },
      dependencies: { merge: defaultMerge },
      peerDependencies: { merge: defaultMerge },
      optionalDependencies: { merge: defaultMerge },
      scripts: { merge: defaultMerge },
      engines: { merge: defaultMerge }
    };

    Object.keys(deepProperties).forEach(category => {
      if (template[category] !== undefined) {
        Object.keys(template[category]).forEach(d => {
          if (target[category] === undefined) {
            target[category] = {};
          }

          const tp = context.expand(template[category][d]);
          if (
            category === 'devDependencies' &&
            target.dependencies !== undefined &&
            target.dependencies[d] === tp
          ) {
            // do not include dev dependency if regular dependency is already present
          } else {
            deepProperties[category].merge(
              target[category],
              target[category][d],
              tp,
              category,
              d,
              messages
            );
          }
        });
      }
    });

    Object.keys(template).forEach(p => {
      if (target[p] === undefined) {
        target[p] = template[p];
        messages.push(`chore(package): add ${p} from template`);
      }
    });

    Object.keys(extraBuilds).forEach(key => {
      target.scripts[key] += ` && ${extraBuilds[key]}`;
    });

    if (target.module === '{{module}}') {
      delete target.module;
    }

    if (
      target.contributors !== undefined &&
      target.author !== undefined &&
      target.author.name !== undefined
    ) {
      const m = target.author.name.match(/(^[^<]+)<([^>]+)>/);
      if (m !== undefined) {
        const name = String(m[1]).replace(/^\s+|\s+$/g, '');
        const email = m[2];

        if (
          target.contributors.find(c => c.name === name && c.email === email)
        ) {
          delete target.author;
        }
      }
    }

    const toBeDeletedModules =
      target.devDependencies === undefined
        ? []
        : Array.from(
            context.optionalDevModules(
              new Set(Object.keys(target.devDependencies))
            )
          ).filter(m => !usedDevModules.has(m));

    toBeDeletedModules.forEach(d => {
      messages = messages.filter(
        m => !m.startsWith(`chore(devDependencies): add ${d}@`)
      );
      delete target.devDependencies[d];
    });

    target = deleter(target, template, messages, []);

    if (target.keywords !== undefined) {
      delete target.keywords['npm-package-template'];
    }

    Object.keys(this.options.keywords).forEach(r =>
      addKeyword(target, new RegExp(r), this.options.keywords[r], messages)
    );

    removeKeyword(target, ['null', null, undefined], messages);

    this.options.actions.forEach(action => {
      if (action.op === 'replace') {
        const value = jp.value(template, action.path);
        if (value !== undefined) {
          const oldValue = jp.value(target, action.path);
          if (oldValue !== value) {
            jp.value(target, action.path, value);
            messages.push(
              `chore(package): set ${action.path}='${value}' as in template`
            );
          }
        }
      }
    });

    if (messages.length === 0) {
      messages.push('chore(package): update package.json from template');
    }

    target = context.expand(target);
    const sortedTarget = {};

    sortedKeys.forEach(key => {
      if (target[key] !== undefined) {
        sortedTarget[key] = target[key];
      }
    });

    Object.keys(target).forEach(key => {
      if (sortedTarget[key] === undefined) {
        sortedTarget[key] = target[key];
      }
    });

    let newContent = JSON.stringify(sortedTarget, undefined, 2);
    const lastChar = newContent[newContent.length - 1];

    // keep trailing newline
    if (originalLastChar === '\n' && lastChar === '}') {
      newContent += '\n';
    }

    return {
      content: newContent,
      messages,
      changed: original !== newContent
    };
  }
}

function deleter(object, reference, messages, path) {
  if (
    typeof object === 'string' ||
    object instanceof String ||
    object === true ||
    object === false ||
    object === undefined ||
    object === null ||
    typeof object === 'number' ||
    object instanceof Number
  ) {
    return object;
  }

  if (Array.isArray(object)) {
    return object.map((e, i) => {
      path.push(i);
      const n = deleter(
        object[i],
        Array.isArray(reference) ? reference[i] : undefined,
        messages,
        path
      );
      path.pop();
      return n;
    });
  }

  if (reference) {
    Object.keys(reference).forEach(key => {
      path.push(key);

      if (reference[key] === '--delete--' && object[key] !== undefined) {
        if (object[key] !== '--delete--') {
          messages.push(`chore(npm): delete ${path.join('.')}`);
        }
        delete object[key];
      } else {
        object[key] = deleter(object[key], reference[key], messages, path);
      }
      path.pop();
    });
  }

  return object;
}

function removeKeyword(pkg, keywords, messages) {
  if (pkg.keywords !== undefined) {
    keywords.forEach(keyword => {
      if (pkg.keywords.find(k => k === keyword)) {
        messages.push(`docs(package): remove keyword ${keyword}`);
        pkg.keywords = pkg.keywords.filter(k => k !== keyword);
      }
    });

    if (pkg.keywords[0] === null || pkg.keywords[0] === undefined) {
      messages.push(`docs(package): remove keyword null`);
      pkg.keywords = [];
    }
  }
}

function addKeyword(pkg, regex, keyword, messages) {
  if (keyword === undefined || keyword === null || keyword === 'null') {
    return;
  }

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

function getVersion(e) {
  const m = e.match(/([\d\.]+)/);
  return m ? Number(m[1]) : undefined;
}

/**
 *
 */
function defaultMerge(destination, target, template, category, name, messages) {
  if (template === '-') {
    if (target !== undefined) {
      messages.push(`chore(${category}): remove ${name}@${target}`);
      delete destination[name];
    }

    return;
  }

  if (target === undefined) {
    messages.push(`chore(${category}): add ${name}@${template} from template`);
    destination[name] = template;
  } else if (template !== target) {
    if (category === 'engines' || category === 'devDependencies') {
      if (getVersion(target) > getVersion(template)) {
        return;
      }
    }

    messages.push(
      `chore(${category}): update ${name}@${template} from template`
    );

    destination[name] = template;
  }
}
