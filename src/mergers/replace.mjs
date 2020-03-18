import { Merger } from "../merger.mjs";

/**
 * Replace file from template (always)
 */
export class Replace extends Merger {

  static async merge(
    context,
    destinationEntry,
    sourceEntry,
    options = this.defaultOptions
  ) {    
    return {
      message: `${options.messagePrefix}overwrite {{entry.name}} with template content`,
      entry: sourceEntry
    };
  }
}
