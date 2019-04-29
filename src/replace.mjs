import { File } from "./file.mjs";

/**
 * Replace file from template (always)
 */
export class Replace extends File {
  async mergeContent(context, original, template) {
    const content = context.expand(template);

    return {
      content,
      changed: content !== original,
      messages: [`chore: overwrite {{entry.name}} with template content`]
    };
  }
}
