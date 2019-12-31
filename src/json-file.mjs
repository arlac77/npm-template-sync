import { merge } from "hinted-tree-merger";
import { actions2messages, aggregateActions } from "./util.mjs";
import { File } from "./file.mjs";

export class JSONFile extends File {
  static matchesFileName(name) {
    return name.match(/\.json$/);
  }

  get needsTemplate() {
    return false;
  }

  async mergeContent(context, original, templateRaw) {
    if (templateRaw === "" || templateRaw === undefined) {
      return undefined;
    }

    const actions = {};

    const content = JSON.stringify(
      merge(
        original === undefined || original.length === 0 ? {} : JSON.parse(original),
        JSON.parse(this.options.expand ? context.expand(templateRaw) : templateRaw)
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
