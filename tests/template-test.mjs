import test from "ava";
import { MockProvider } from "mock-repository-provider";

import { Template } from "../src/template.mjs";

const provider = new MockProvider({
  template: {
    master: {
      "package.json": JSON.stringify({
        devDependencies: { ava: "^2.4.0" },
        template: {
          files: [
            { merger: "Package", pattern: "package.json", options: { o1: 77 } }
          ],
          inheritFrom: ["template_b"]
        }
      }),
      file_a: "content a"
    }
  },
  template_b: {
    master: {
      "package.json": JSON.stringify({
        devDependencies: { rollup: "^1.29.1" },
        template: {
          files: [{ merger: "Travis", pattern: ".travis.yml" }],
          inheritFrom: ["template_b"]
        }
      }),
      file_b: "content b"
    }
  }
});

test.serial("template constructor", async t => {
  const template = new Template(provider, ["template"]);
  t.deepEqual(template.sources, ["template"]);
  t.is(`${template}`, "template");
  t.is(template.name, "template");

  const m = await template.mergers();

  //console.log(m);
  //t.is(m.length, 2);
  
  t.deepEqual(m[0].options, { actions: [], keywords: [], o1: 77 });

  for (const i of ["a", "b"]) {
    const f = await template.entry(`file_${i}`);
    t.is(f.name, `file_${i}`);
    t.is(await f.getString(), `content ${i}`);
  }
});

test.serial("template cache", async t => {
  const t1 = await Template.templateFor(provider, ["template"]);
  t.deepEqual(t1.sources, ["template"]);
  const t2 = await Template.templateFor(provider, ["template"]);
  t.is(t1, t2);
});

test.serial("template package content", async t => {
  const template = new Template(provider, ["template"]);

  t.deepEqual(await template.package(), {
    devDependencies: { ava: "^2.4.0", rollup: "^1.29.1" },
    template: {
      files: [
        { merger: "Package", pattern: "package.json", options: { o1: 77 } },
        { merger: "Travis", pattern: ".travis.yml" }
      ],
      inheritFrom: ["template_b"]
    }
  });
});

test.serial("template mergers", async t => {
  const template = new Template(provider, ["template"]);
  const mergers = await template.mergers();

  t.is(mergers.length, 1);
  t.is(mergers[0].name, "package.json");
  t.is(mergers[0].constructor.name, "Package");
});