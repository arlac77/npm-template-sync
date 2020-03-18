import { StringContentEntry } from "content-entry";
import { Merger } from "../merger.mjs";

function getRanges(array) {
  const ranges = [];
  let rstart, rend;
  for (let i = 0; i < array.length; i++) {
    rstart = array[i];
    rend = rstart;
    while (array[i + 1] - array[i] === 1) {
      rend = array[i + 1]; // increment the index if the numbers sequential
      i++;
    }
    ranges.push(rstart == rend ? rstart + "" : rstart + "-" + rend);
  }
  return ranges;
}

function yearsToString(years) {
  const ranges = getRanges(
    Array.from(years).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  );
  return ranges.join(",");
}

export function stringToIntegers(str) {
  const years = new Set();

  while (true) {
    let m = str.match(/^(\d+)(\s*,\s*)?(.*)/);

    if (m) {
      const low = parseInt(m[1], 10);
      years.add(low);

      str = m[3];
      m = str.match(/^-(\d+)(.*)/);

      if (m && m[1]) {
        str = m[2];
        const high = parseInt(m[1], 10);
        for (let y = low; y <= high; y++) {
          years.add(y);
        }
      }
    }
    else {
      break;
    }
  }
  return years;
}

export class License extends Merger {
  static get pattern() {
    return "**/LICENSE*";
  }

  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      messagePrefix: "chore(license): "
    };
  }

  static async merge(
    context,
    destinationEntry,
    sourceEntry,
    options = this.defaultOptions
  ) {
    let message;

    const year = context.evaluate("date.year");
    let years = new Set();

    const original = await destinationEntry.getString();

    const m = original.match(
      /opyright\s*\(c\)\s*((\d+)([,\-\d]+)*)(\s*(,|by)\s*(.*))?/
    );

    if (m) {
      years = stringToIntegers(m[1]);

      if (m[5] !== undefined) {
        context.properties.license.owner = m[6];
      }

      if (!years.has(year)) {
        years.add(year);
        message = `${options.messagePrefix}add year ${year}`;
      }
    }

    if (!message) {
      message = `${options.messagePrefix}update`;
    }

    let entry = await sourceEntry;

    if (original !== "") {
      entry = new StringContentEntry(destinationEntry.name, original.replace(
        /opyright\s*\(c\)\s*(\d+)([,\-\d])*/,
        `opyright (c) ${yearsToString(years)}`
      ));
    }

    return {
      entry,
      message
    };
  }
}
