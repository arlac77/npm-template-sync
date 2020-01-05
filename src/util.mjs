import { mergeArrays, isScalar } from "hinted-tree-merger";

export const defaultEncodingOptions = { encoding: "utf8" };

export function asArray(o) {
  return Array.isArray(o) ? o : [o];
}

/**
 * find merger options in the template section of a package.json
 * @param {Object} json
 * @param {string} name
 * @return {Object}
 */
export function templateOptions(json, name) {
  if (json.template !== undefined && json.template.files !== undefined) {
    const m = json.template.files.find(f => f.merger === name);
    if (m !== undefined && m.options !== undefined) {
      return m.options;
    }
  }
  return {};
}

export function setProperty(properties, attributePath, value) {
  const m = attributePath.match(/^(\w+)\.(.*)/);

  if (m) {
    const key = m[1];
    if (properties[key] === undefined) {
      properties[key] = {};
    }
    setProperty(properties[key], m[2], value);
  } else {
    properties[attributePath] = value;
  }
}

/**
 *
 */
export function jspath(object, path, cb) {
  let parts = path.split(".");

  parts = parts.reduce((a, c) => {
    const m = c.match(/^(\w+)\['(.+)'\]$/);
    return m ? [...a, m[1], m[2]] : [...a, c];
  }, []);

  //console.log(parts);

  const last = parts.pop();

  for (const p of parts) {
    if (p === "$") {
      continue;
    }

    const n = object[p];
    if (n === undefined) {
      return undefined;
    }
    object = n;
  }

  if (cb !== undefined) {
    cb(object[last], value => {
      object[last] = value;
    });
  }

  return object[last];
}

export function mergeTemplateFiles(a, b) {
  return mergeArrays(a, b, "", undefined, {
    "": { key: ["merger", "pattern"] },
    "*.options.badges": {
      key: "name",
      compare: (a, b) => a.name.localeCompare(b.name)
    }
  });
}

export async function templateFilesFrom(pkg, provider, repo) {
  if (!pkg) {
    const branch = await provider.branch(repo);
    const pc = await branch.entry("package.json");
    pkg = JSON.parse(await pc.getString());
  }

  const template = pkg.template;

  if (template) {
    if (template.inheritFrom) {
      const itf = await templateFilesFrom(
        undefined,
        provider,
        template.inheritFrom
      );

      return template.files ? mergeTemplateFiles(template.files, itf) : itf;
    }

    if (template.files) {
      return template.files;
    }
  }

  return [];
}

export function actions2messages(actions, prefix, name) {
  const messages = Object.entries(actions).map(([slot, a]) => {
    const toValue = s => (s !== undefined && isScalar(s) ? s : undefined);
    const verbs = ["add", "remove", "update"]
      .map(verb => [
        verb,
        a.map(x => toValue(x[verb])).filter(x => x !== undefined)
      ])
      .filter(([name, value]) => value.length > 0)
      .map(([name, value]) => `${name} ${value}`);

    verbs.push(`(${slot.replace(/\[\d*\]/, "")})`);

    return a.type ? `${a.type}(${a.scope}): ` : prefix + verbs.join(" ");
  });

  return messages.length === 0 ? [`${prefix}merge from template ${name}`] : messages;
}

export function aggregateActions(actions, action, hint) {
  if (hint) {
    for (const key of ["type", "scope"]) {
      if (hint[key]) {
        action[key] = hint[key];
      }
    }
  }

  if (actions[action.path] === undefined) {
    actions[action.path] = [action];
  } else {
    actions[action.path].push(action);
  }
  delete action.path;
}
