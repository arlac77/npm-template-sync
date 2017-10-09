import { createContext } from 'expression-expander';

export default class Context {
  constructor(targetRepo, templateRepo, properties) {
    this.ctx = createContext({
      keepUndefinedValues: true,
      leftMarker: '{{',
      rightMarker: '}}',
      markerRegexp: '{{([^}]+)}}'
    });

    this.ctx.properties = properties;

    Object.defineProperty(this, 'properties', {
      value: properties
    });

    Object.defineProperty(this, 'files', {
      value: new Map()
    });

    Object.defineProperty(this, 'targetRepo', {
      value: targetRepo
    });
    Object.defineProperty(this, 'templateRepo', {
      value: templateRepo,
      writable: true
    });
  }

  expand(...args) {
    return this.ctx.expand(...args);
  }

  addFile(file) {
    this.files.set(file.path, file);
  }

  async usedDevModules() {
    const usedModuleSets = await Promise.all(
      Array.from(this.files.values()).map(async file => {
        let usedDevModules;
        if (file.path === 'package.json') {
          usedDevModules = file.usedDevModules(
            file.originalContent(this, { ignoreMissing: true })
          );
        } else {
          const m = await file.merge(this);
          usedDevModules = file.usedDevModules(m.content);
        }

        console.log(
          `usedDevModules: ${file.path} -> ${Array.from(usedDevModules)}`
        );
        return usedDevModules;
      })
    );

    return usedModuleSets.reduce(
      (sum, current) => new Set([...sum, ...current]),
      new Set()
    );
  }

  optionalDevModules(modules) {
    return Array.from(this.files.values())
      .map(file => file.optionalDevModules(modules))
      .reduce((sum, current) => new Set([...sum, ...current]), new Set());
  }

  set text(value) {
    if (this.spinner === undefined) {
      console.log(value);
    } else {
      this.spinner.text = value;
    }
  }

  succeed(...args) {
    if (this.spinner === undefined) {
      console.log(...args);
    } else {
      this.spinner.succeed(...args);
    }
  }

  warn(...args) {
    if (this.spinner === undefined) {
      console.log(...args);
    } else {
      this.spinner.warn(...args);
    }
  }

  fail(...args) {
    if (this.spinner === undefined) {
      console.log(...args);
    } else {
      this.spinner.fail(...args);
    }
  }
}
