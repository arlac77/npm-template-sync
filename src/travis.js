/* jslint node: true, esnext: true */

const yaml = require('js-yaml');

export default function (target, template, options = {}) {
  const yml = yaml.safeLoad(target);
  const tyml = yaml.safeLoad(template);

  Object.keys(tyml).forEach(name => {
    yml[name] = tyml[name];
  });

  return yaml.safeDump(yml);
}
