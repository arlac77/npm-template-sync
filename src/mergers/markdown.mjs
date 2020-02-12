import unified from "unified";
import markdown from "remark-parse";
import rehype2remark from "rehype-remark";
import stringify from "remark-stringify";
import { StringContentEntry } from "content-entry";
import { Merger } from "../merger.mjs";
import { actions2message } from "../util.mjs";

export class Markdown extends Merger {
  static get pattern() {
    return "**/*.md";
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

    const processor = unified()
      .use(markdown)
      .use(rehype2remark)
      .use(stringify);

    let content;

    processor.process(original, function(err, file) {
      content = file.contents;
    });

    return {
      message: actions2message(actions, options.messagePrefix, name),
      entry: new StringContentEntry(name, content)
    };
  }
}
