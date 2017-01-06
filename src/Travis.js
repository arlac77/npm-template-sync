/* jslint node: true, esnext: true */

import File from './File';

const yaml = require('js-yaml'),
  deepExtend = require('deep-extend');

export default class Travis extends File {

  get merge() {
    return Promise.all([this.originalContent(), this.templateContent()]).then(contents => {
      const [original, template] = contents;

      const yml = yaml.safeLoad(original) || {};
      const tyml = yaml.safeLoad(this.context.expand(template));
      const before_script = yml.before_script;

      const email = yml.notifications.email;

      deepExtend(yml, tyml);

      if (email) {
        yml.notifications.email = email;
      }

      if (before_script) {
        before_script.forEach(s => {
          if (!yml.before_script.find(e => e === s)) {
            yml.before_script.push(s);
          }
        });
      }

      return {
        path: this.path,
        content: yaml.safeDump(yml),
        changed: true,
        message: undefined
      };
    });
  }
}
