import test from "ava";
import { MockProvider } from "mock-repository-provider";

import { Context } from "../src/context.mjs";
import { PreparedContext } from "../src/prepared-context.mjs";
import { Package } from "../src/package.mjs";

const FILE_NAME = "package.json";

async function createContext(template, target) {
  const provider = new MockProvider({
    templateRepo: {
      master: {
        [FILE_NAME]:
          template !== undefined
            ? JSON.stringify(template, undefined, 2)
            : undefined
      }
    },
    "tragetUser/targetRepo": {
      master: {
        [FILE_NAME]:
          target !== undefined
            ? JSON.stringify(target, undefined, 2)
            : undefined
      }
    }
  });

  return await PreparedContext.from(
    new Context(provider, {
      templateBranchName: "templateRepo",
      github: {
        repo: "the-repo-name",
        user: "the-user-name"
      },
      user: "x-user"
    }),
    "tragetUser/targetRepo"
  );
}

async function pkgt(t, template, content, expected, messages = [], changed) {
  const context = await createContext(template, content);

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  switch (changed) {
    case true:
      t.true(merged.changed);
    case false:
      t.false(merged.changed);
  }

  if (merged.changed) {
    t.deepEqual(merged.messages, messages);

    t.deepEqual(
      JSON.parse(merged.content),
      expected === undefined ? content : expected
    );
  } else {
    t.true(true);
  }
}

pkgt.title = (providedTitle = "", template, content, expected, messages = []) =>
  `package ${providedTitle} ${JSON.stringify(
    template
  )} ${content} ${expected}`.trim();

test(
  "empty bugs results in no change",
  pkgt,
  {},
  {
    name: "targetRepo",
    repository: {
      type: "git",
      url: "http://mock-provider.com/tragetUser/targetRepo"
    },
    bugs: { url: "http://mock-provider.com/tragetUser/targetRepo/issues" },
    homepage: "http://mock-provider.com/tragetUser/targetRepo#readme",
    template: {
      repository: {
        url: "http://mock-provider.com/templateRepo"
      }
    }
  },
  false
);

test(
  "repository change only",
  pkgt,
  {},
  {
    homepage: "http://mock-provider.com/tragetUser/targetRepo#readme",
    bugs: {
      url: "http://mock-provider.com/tragetUser/targetRepo/issues"
    },
    template: {
      repository: {
        url: "http://mock-provider.com/templateRepo"
      }
    }
  },
  {
    name: "targetRepo",
    homepage: "http://mock-provider.com/tragetUser/targetRepo#readme",
    bugs: {
      url: "http://mock-provider.com/tragetUser/targetRepo/issues"
    },
    repository: {
      type: "git",
      url: "http://mock-provider.com/tragetUser/targetRepo"
    },
    template: {
      repository: {
        url: "http://mock-provider.com/templateRepo"
      }
    }
  },
  ["chore(package):  (repository)"]
);

test(
  "remove empty deps",
  pkgt,
  {
    dependencies: {},
    repository: {
      type: "git",
      url: "http://mock-provider.com/tragetUser/targetRepo"
    }
  },
  {
    homepage: "http://mock-provider.com/tragetUser/targetRepo#readme",
    bugs: {
      url: "http://mock-provider.com/tragetUser/targetRepo/issues"
    },
    template: {
      repository: {
        url: "http://mock-provider.com/templateRepo"
      }
    }
  },
  {
    name: "targetRepo",
    homepage: "http://mock-provider.com/tragetUser/targetRepo#readme",
    bugs: {
      url: "http://mock-provider.com/tragetUser/targetRepo/issues"
    },
    repository: {
      type: "git",
      url: "http://mock-provider.com/tragetUser/targetRepo"
    },
    template: {
      repository: {
        url: "http://mock-provider.com/templateRepo"
      }
    }
  },
  ["chore(package):  (dependencies)",
  "chore(package):  (repository)"]
);

test("default options", t => {
  const pkg = new Package("package.json");
  t.deepEqual(pkg.options.actions, []);

  const pkg2 = new Package("package.json", {
    actions: [{ path: "$.nyc['report-dir']", op: "replace" }]
  });
  t.deepEqual(pkg2.options.actions, [
    { path: "$.nyc['report-dir']", op: "replace" }
  ]);
});

test("package extract properties", async t => {
  const context = await createContext(
    {},
    {
      name: "aName",
      version: "1.2.3",
      description: "a description",
      module: "a module",
      config: {
        api: "/some/path"
      }
    }
  );

  const pkg = new Package("package.json");
  const targetBranch = await context.provider.branch("tragetUser/targetRepo");
  const properties = await pkg.properties(targetBranch);

  t.deepEqual(properties, {
    npm: { name: "aName", fullName: "aName" },
    //license: { owner: 'tragetUser' },
    description: "a description",
    module: "a module",
    name: "aName",
    version: "1.2.3",
    api: "/some/path"
  });
});

test("package extract properties not 0.0.0-semantic-release", async t => {
  const context = await createContext(
    {},
    {
      name: "aName",
      version: "0.0.0-semantic-release"
    }
  );

  const pkg = new Package("package.json");
  const targetBranch = await context.provider.branch("tragetUser/targetRepo");
  const properties = await pkg.properties(targetBranch);

  t.deepEqual(properties, {
    npm: { name: "aName", fullName: "aName" },
    name: "aName"
  });
});

test("package merge engines (skip lower versions in template)", async t => {
  const context = await createContext(
    {
      engines: {
        node: ">=8"
      }
    },
    {
      engines: {
        node: ">=10"
      }
    }
  );

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).engines, {
    node: ">=10"
  });
});

test("delete entries", async t => {
  const context = await createContext(
    {
      slot: {
        something: "--delete--",
        add: 2
      },
      other: "--delete--"
    },
    {
      slot: {
        something: {
          a: 1
        },
        preserve: 3
      }
    }
  );

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).slot, {
    add: 2,
    preserve: 3
  });

  t.false(merged.messages.includes("chore(package): delete other"));
  t.true(merged.messages.includes("chore(package):  (slot.something)"));
});

test("package preserve extra prepare", async t => {
  const context = await createContext(
    {
      scripts: {
        prepare: "rollup x y && chmod +x bin/xx",
        preprocess: "rollup a"
      }
    },
    {
      scripts: {
        prepare: "rollup x y && chmod +x bin/xx",
        preprocess: "rollup a && chmod +x bin/yy"
      }
    }
  );

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).scripts, {
    prepare: "rollup x y && chmod +x bin/xx",
    preprocess: "rollup a && chmod +x bin/yy"
  });
});

test("package handle missing scripts in template", async t => {
  const context = await createContext(
    {
      scripts: {
        prepare: "rollup"
      }
    },
    {}
  );

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).scripts, {
    prepare: "rollup"
  });
});

test("package bin with expander", async t => {
  const context = await createContext(
    {
      bin: {
        a: "bin/a"
      }
    },
    {
      bin: {
        "{{name}}": "bin/{{name}}",
        "{{name}}-systemd": "bin/{{name}}-systemd"
      }
    }
  );

  context.properties.name = "myName";

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).bin, {
    a: "bin/a",
    myName: "bin/myName",
    "myName-systemd": "bin/myName-systemd"
  });
});

test("package devDependencies keep cracks", async t => {
  const context = await createContext(
    {
      devDependencies: {}
    },
    {
      release: {
        verifyRelease: "cracks"
      },
      devDependencies: {
        cracks: "3.1.2",
        "dont-crack": "1.0.0"
      }
    }
  );

  const pkg = new Package("package.json");
  context.addFile(pkg);

  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).devDependencies, {
    cracks: "3.1.2"
  });
});

test("package devDependencies remove cracks", async t => {
  const context = await createContext(
    {
      devDependencies: {
        "special" : "1.0.0"
      }
    },
    {
      devDependencies: {
        cracks: "3.1.2",
        "dont-crack": "1.0.0",
      }
    }
  );

  const pkg = new Package("package.json");
  context.addFile(pkg);
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).devDependencies, { special : "1.0.0"});
  //t.true(merged.messages.includes('chore(devDependencies): remove cracks'));
});

test("package devDependencies", async t => {
  const context = await createContext(
    {
      devDependencies: {
        a: "--delete--",
        c: "1",
        d: "--delete--",
        e: "1"
      }
    },
    {
      devDependencies: {
        a: "1",
        b: "1",
        e: "2"
      }
    }
  );

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).devDependencies, {
    b: "1",
    c: "1",
    e: "2"
  });

  t.true(
    merged.messages.includes("chore(package):  remove 1 (devDependencies.a)") &&
      merged.messages.includes("chore(package):  add 1 (devDependencies.c)")
  );
});

test("package dependencies only increase", async t => {
  const context = await createContext(
    {
      devDependencies: {
        a: "0.25.0",
        b: "0.25.0",
        c: "0.25.0"
      }
    },
    {
      devDependencies: {
        a: "^0.25.1",
        b: "^1.0.0-beta.5.1",
        c: "^0.24.9",
        d: "~0.24.9"
      }
    }
  );

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).devDependencies, {
    a: "^0.25.1",
    b: "^1.0.0-beta.5.1",
    c: "0.25.0",
    d: "~0.24.9"
  });
});

test("package dependencies increase beta <> rc", async t => {
  const context = await createContext(
    {
      devDependencies: {
        a: "^1.0.0-rc.1"
      }
    },
    {
      devDependencies: {
        a: "^1.0.0-beta.8"
      }
    }
  );

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).devDependencies, {
    a: "^1.0.0-rc.1"
  });
});

test("package dependencies git", async t => {
  const context = await createContext(
    {
      devDependencies: {
        a: "git+https://github.com/arlac77/light-server.git"
      }
    },
    {
      devDependencies: {
        a: "^1.0.0-rc.1"
      }
    }
  );

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).devDependencies, {
    a: "git+https://github.com/arlac77/light-server.git"
  });
});

test("package keywords", async t => {
  const context = await createContext(
    {},
    {
      name: "abc_xxx_1",
      template: {
        repository: {
          url: `https://github.com/.git`
        }
      },
      keywords: ["A", "B", "npm-package-template"]
    }
  );

  const pkg = new Package("package.json", {
    keywords: {
      _xxx_: "X"
    }
  });
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).keywords, ["A", "B", "X"]);
  t.true(merged.messages.includes("docs(package): add keyword X"));
});

test("package keywords empty", async t => {
  const context = await createContext(
    {},
    {
      name: "abc_xxx_1"
    }
  );

  const pkg = new Package("package.json", {
    keywords: {
      _xxx_: "XXX"
    }
  });
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).keywords, ["XXX"]);
  t.true(merged.messages.includes("docs(package): add keyword XXX"));
});

test("package remove null keyword", async t => {
  const context = await createContext(
    {
      template: {}
    },
    {
      name: "abc_xxx_1",
      keywords: [null]
    }
  );

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).keywords, []);
  t.true(merged.messages.includes("docs(package): remove keyword null"));
});

test("package remove unexpanded {{xxx}}", async t => {
  const context = await createContext(
    {
      template: {}
    },
    {
      browser: "{{browser}}",
      main: "a value"
    }
  );

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  const result = JSON.parse(merged.content);

  t.true(result.browser === undefined);
  t.true(result.main === "a value");
  t.true(
    merged.messages.includes(
      "chore(package): remove unknown value for browser ({{browser}})"
    )
  );
});

test("add xo/space=true", async t => {
  const context = await createContext(
    {
      xo: {
        space: true
      }
    },
    {
      xo: {
        space: true
      }
    }
  );

  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).xo, {
    space: true
  });
  //t.true(merged.messages.includes('chore: update package.json'));
});

test("jsonpath", async t => {
  const context = await createContext(
    {
      nyc: {
        "report-dir": "./build/coverage"
      }
    },
    {
      nyc: {
        "report-dir": "./coverage"
      }
    }
  );

  const pkg = new Package("package.json", {
    actions: [{ path: "$.nyc['report-dir']", op: "replace" }]
  });
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content).nyc, {
    "report-dir": "./build/coverage"
  });

  t.true(
    merged.messages.includes(
      "chore(package):  add ./build/coverage (nyc.report-dir)"
    )
  );
});

test("package start fresh", async t => {
  const context = await createContext({});
  const pkg = new Package("package.json");
  const merged = await pkg.merge(context);

  t.deepEqual(JSON.parse(merged.content), {
    name: "targetRepo",
    homepage: "http://mock-provider.com/tragetUser/targetRepo#readme",
    bugs: {
      url: "http://mock-provider.com/tragetUser/targetRepo/issues"
    },
    repository: {
      type: "git",
      url: "http://mock-provider.com/tragetUser/targetRepo"
    },
    template: {
      repository: {
        url: "http://mock-provider.com/templateRepo"
      }
    }
  });
});
