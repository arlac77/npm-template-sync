import micromatch from "micromatch";
import {
  merge,
  mergeVersionsLargest,
  mergeExpressions,
  mergeSkip,
  compare
} from "hinted-tree-merger";
import { StringContentEntry } from "content-entry";
import { LogLevelMixin } from "loglevel-mixin";

import { asArray } from "./util.mjs";
import { ReplaceIfEmpty } from "./mergers/replace-if-empty.mjs";
import { mergers } from "./mergers.mjs";

const templateCache = new Map();

/**
 * @param {RepositoryProvider} provider
 * @param {string[]} sources
 *
 * @property {RepositoryProvider} provider
 * @property {string[]} sources
 * @property {Set<Branch>} branches all used branches direct and inherited
 * @property {Set<Branch>} initialBranches root branches used to define the template
 */
export const Template = LogLevelMixin(
  class _Template {
    static clearCache() {
      templateCache.clear();
    }

    static async templateFor(context, urls) {
      urls = asArray(urls);
      const key = urls.join(",");
      let template = templateCache.get(key);

      if (template === undefined) {
        template = new Template(context, urls);
        await template.initialize();
        templateCache.set(key, template);
      }

      return template;
    }

    constructor(context, sources) {
      Object.defineProperties(this, {
        context: { value: context },
        provider: { value: context.provider },
        sources: { value: sources },
        branches: { value: new Set() },
        initialBranches: { value: new Set() },
        entryCache: { value: new Map() }
      });
    }

    get name() {
      return (this.initialBranches.size > 0
        ? [...this.initialBranches].map(b => b.fullCondensedName)
        : this.sources
      ).join(",");
    }

    toString() {
      return this.name;
    }

    log(...args) {
      this.context.log(...args);
    }

    async entry(name) {
      await this.initialize();

      /*console.log("ENTRY", name, this.entryCache.get(name), [
      ...this.entryCache.keys()
    ]);*/

      const entry = this.entryCache.get(name);
      if (entry === undefined) {
        throw new Error(`No such entry ${name}`);
      }

      return entry;
    }

    async initialize() {
      if (this.entryCache.size > 0) {
        return;
      }

      this.entryCache.set(
        "package.json",
        new StringContentEntry(
          "package.json",
          JSON.stringify(await this._templateFrom(this.sources, true))
        )
      );

      //console.log(await this.entryCache.get("package.json").getString());

      for (const branch of this.branches) {
        if (branch) {
          for await (const entry of branch.entries()) {
            const name = entry.name;
            if (name === "package.json") {
              continue;
            }

            const ec = this.entryCache.get(entry.name);
            if (ec) {
              this.entryCache.set(name, await this.mergeEntry(this.context, entry, ec));
            } else {
              this.entryCache.set(name, entry);
            }
          }
        }
      }
    }

    async mergeEntry(ctx, a, b) {
      for (const merger of mergers) {
        const found = micromatch([a.name], merger.pattern);
        if (found.length) {
          const commit = await merger.merge(ctx, a, b, {
            ...merger.defaultOptions,
            mergeHints: Object.fromEntries(
              Object.entries(merger.defaultOptions.mergeHints).map(([k, v]) => [
                k,
                { ...v, keepHints: true }
              ])
            )
          });
          /*if(a.name === '.travis.yml') {
          console.log(await commit.entry.getString());
        }*/
          return commit.entry;
        }
      }

      return a;
    }

    /**
     * load all templates and collects the files
     * @param {string|Object} sources repo nmae or package content
     */
    async _templateFrom(sources, isInitialSource) {
      let result = {};

      for (const source of sources) {
        const branch = await this.provider.branch(source);

        if (branch === undefined || this.branches.has(branch)) {
          continue;
        }

        this.branches.add(branch);
        if (isInitialSource) {
          this.initialBranches.add(branch);
        }

        try {
          const pc = await branch.entry("package.json");

          try {
            const pkg = JSON.parse(await pc.getString());

            result = mergeTemplate(result, pkg);

            const template = pkg.template;

            if (template && template.inheritFrom) {
              result = mergeTemplate(
                result,
                await this._templateFrom(asArray(template.inheritFrom))
              );
            }
          } catch (e) {
            this.error(branch.fullCondensedName, e);
          }
        } catch (e) {
          continue;
        }
      }

      return result;
    }

    async *entries(matchingPatterns) {
      await this.initialize();

      for (const [name, entry] of this.entryCache) {
        yield entry;
      }
    }

    async package() {
      const entry = await this.entry("package.json");
      return JSON.parse(await entry.getString());
    }

    async properties() {
      const pkg = await this.package();
      return pkg.template ? pkg.template.properties : undefined;
    }

    /**
     *
     */
    async mergers() {
      await this.initialize();

      const pkg = await this.package();

      // order default pattern to the last
      const mappings = pkg.template.files.sort((a, b) => {
        if (a.pattern === "**/*") return 1;
        if (b.pattern === "**/*") return -1;
        return 0;
      });

      const factories = mergers;

      let alreadyPresent = new Set();
      const names = [...this.entryCache.values()]
        .filter(entry => entry.isBlob)
        .map(entry => entry.name);

      return mappings
        .map(mapping => {
          const found = micromatch(names, mapping.pattern);
          const notAlreadyProcessed = found.filter(f => !alreadyPresent.has(f));

          alreadyPresent = new Set([...Array.from(alreadyPresent), ...found]);

          return notAlreadyProcessed.map(name => {
            const factory =
              factories.find(merger => merger.name === mapping.merger) ||
              ReplaceIfEmpty;

            return new factory(name, mapping.options);
          });
        })
        .reduce((last, current) => Array.from([...last, ...current]), []);
    }

    async addUsedPackage(targetBranch) {
      await this.initialize();

      return Promise.all(
        [...this.initialBranches].map(async sourceBranch => {
          const name = targetBranch.fullCondensedName;
          const entry = await sourceBranch.entry("package.json");
          const pkg = JSON.parse(await entry.getString());

          if (pkg.template === undefined) {
            pkg.template = {};
          }
          if (!Array.isArray(pkg.template.usedBy)) {
            pkg.template.usedBy = [];
          }

          if (!pkg.template.usedBy.find(n => n === name)) {
            pkg.template.usedBy.push(name);
            pkg.template.usedBy = pkg.template.usedBy.sort();

            const prBranch = await sourceBranch.createBranch(
              `npm-template-sync-track/${name}`
            );

            await prBranch.commit(`fix: add ${name}`, [
              new StringContentEntry(
                "package.json",
                JSON.stringify(pkg, undefined, 2)
              )
            ]);

            return sourceBranch.createPullRequest(prBranch, {
              title: `add ${name}`,
              body: `add tracking info for ${name}`
            });
          }
        })
      );
    }
  }
);

export function mergeTemplate(a, b) {
  const mvl = { keepHints: true, merge: mergeVersionsLargest };
  return merge(a, b, "", undefined, {
    "engines.*": mvl,
    "scripts.*": { keepHints: true, merge: mergeExpressions },
    "dependencies.*": mvl,
    "devDependencies.*": mvl,
    "peerDependencies.*": mvl,
    "optionalDependencies.*": mvl,
    "config.*": { overwrite: false },
    "pacman.*": { overwrite: false },
    "pacman.depends.*": mvl,
    "template.files": { key: ["merger", "pattern"] },
    "template.inheritFrom": { merge: mergeSkip },
    "template.usedBy": { merge: mergeSkip },
    "*.options.badges": {
      key: "name",
      compare,
      keepHints: true
    },
    "*": {
      keepHints: true
    }
  });
}
