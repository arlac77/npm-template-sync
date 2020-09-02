import lockfile from '@yarnpkg/lockfile';
import { StringContentEntry } from "content-entry";
import { merge } from "hinted-tree-merger";
import { Merger } from "../merger.mjs";
import { actions2message, aggregateActions } from "../util.mjs";

export class YARNLockfile extends Merger {
  static get pattern() {
    return "yarn.lockfile";
  }

  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      messagePrefix: "chore: "
    };
  }

  static async merge(
    context,
    destinationEntry,
    sourceEntry,
    options = this.defaultOptions
  ) {
    const name = destinationEntry.name;
    const original = await destinationEntry.getString();
    const template = await sourceEntry.getString();

    const actions = {};

    //console.log(lockfile.parse(original).object);

    const merged = lockfile.stringify(
      merge(
        lockfile.parse(original).object,
        lockfile.parse(template).object,
        "",
        (action, hint) => aggregateActions(actions, action, hint),
        options.mergeHints
      )
    );

    return original === merged
      ? undefined
      : {
          entry: new StringContentEntry(name, merged),
          message: actions2message(actions, options.messagePrefix, name)
        };
  }
}
