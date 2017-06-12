import File from './File';

export default class License extends File {
  get merge() {
    return Promise.all([this.originalContent({
      ignoreMissing: true
    }), this.templateContent()]).then(([original, template]) => {
      const m = original.match(/opyright\s*\(c\)\s*(\d+)([,\-\d]+)*(\s*(,|by)\s*(.*))?/);
      const properties = this.context.properties;

      if (m) {
        const years = new Set();
        years.add(properties['date.year']);
        years.add(parseInt(m[1], 10));

        if (m[2] !== undefined) {
          m[2].split(/\s*[,\-]\s*/).forEach(y => {
            if (y.length > 0) {
              years.add(parseInt(y, 10));
            }
          });
        }

        if (m[4] !== undefined) {
          properties['license.owner'] = m[5];
        }

        properties['date.year'] = Array.from(years).sort((a, b) => a < b ? -1 : a > b ? 1 : 0).join(',');
      }

      if (original !== '') {
        const content = original.replace(/opyright\s*\(c\)\s*(\d+)([,\-\d])*/,
          `opyright (c) ${properties['date.year']}`);

        return {
          path: this.path,
          changed: content !== original,
          messages: ['fix: update LICENSE'],
          content
        };
      }

      return {
        path: this.path,
        content: this.context.expand(template),
        changed: true,
        messages: [`fix: add LICENSE`]
      };
    });
  }
}
