import { encode, decode } from "./ini-encoder.mjs";
import { merge } from "hinted-tree-merger";
import { File } from "./file.mjs";
import { actions2messages, aggregateActions } from "./util.mjs";

export class INI extends File {
  static matchesFileName(name) {
    return name.match(/\.ini$/);
  }

  static get defaultOptions() {
    return { ...super.defaultOptions, expand: false };
  }

  get needsTemplate() {
    return false;
  }

  async mergeContent(context, original, templateRaw) {
    if (templateRaw === "" || templateRaw === undefined) {
      return undefined;
    }

    const actions = {};

    const content = encode(
      merge(
        decode(original) || {},
        decode(this.options.expand ? context.expand(templateRaw) : templateRaw)
      ),
      "",
      action => aggregateActions(actions, action),
      this.options.mergeHints
    );

    return {
      content,
      changed: content !== original,
      messages: actions2messages(actions, this.options.messagePrefix, this.name)
    };
  }
}
