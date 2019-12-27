import stringify from "@iarna/toml/stringify.js";
import parse from "@iarna/toml/parse-string.js";
import { merge } from "hinted-tree-merger";
import { File } from "./file.mjs";
import { actions2messages } from './util.mjs';

export class TOML extends File {
  static matchesFileName(name) {
    return name.match(/\.toml$/);
  }

  get needsTemplate() {
    return false;
  }

  async mergeContent(context, original, templateRaw) {
    if (templateRaw === "" || templateRaw === undefined) {
      return undefined;
    }

    const actions = {};

    const content = stringify(
      merge(parse(original) || {}, parse(context.expand(templateRaw))),
      "",
      action => {
        if (actions[action.path] === undefined) {
          actions[action.path] = [action];
        } else {
          actions[action.path].push(action);
        }
        delete action.path;
      }
    );

    return {
      content,
      changed: content !== original,
      messages: actions2messages(actions, "chore(toml):", this.name)
    };
  }
}
