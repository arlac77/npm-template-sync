import yaml from "js-yaml";
import {
  mergeVersionsPreferNumeric,
  merge,
  isScalar
} from "hinted-tree-merger";
import { File } from "./file.mjs";
import { actions2messages } from "./util.mjs";

export class Travis extends File {
  static matchesFileName(name) {
    return name === ".travis.yml";
  }

  async mergeContent(context, original, template) {
    const ymlOptions = { schema: yaml.FAILSAFE_SCHEMA };
    const actions = {};

    const content = yaml.safeDump(
      merge(
        yaml.safeLoad(original, ymlOptions) || {},
        yaml.safeLoad(context.expand(template), ymlOptions),
        "",
        action => {
          if (actions[action.path] === undefined) {
            actions[action.path] = [action];
          } else {
            actions[action.path].push(action);
          }
          delete action.path;
        },
        {
          "*": { removeEmpty: true },
          "*node_js": { merge: mergeVersionsPreferNumeric },
          "jobs.include": {
            key: "stage"
          }
        }
      ),
      {
        lineWidth: 128
      }
    );

    return {
      content,
      changed: content !== original,
      messages: actions2messages(actions, "chore(travis):", this.name)
    };
  }
}
