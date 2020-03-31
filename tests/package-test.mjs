import test from "ava";
import { StringContentEntry, EmptyContentEntry } from "content-entry";
import { createContext } from "./helpers/util.mjs";

import { Package } from "../src/mergers/package.mjs";

const FILE_NAME = "package.json";

async function pkgt(t, template, content, options, expected, message) {
  const context = await createContext({
    template: "templateRepo",
    github: {
      repo: "the-repo-name",
      user: "the-user-name"
    },
    user: "x-user"
  });

  const commit = await Package.merge(
    context,
    content === undefined
      ? new EmptyContentEntry(FILE_NAME)
      : new StringContentEntry(FILE_NAME, JSON.stringify(content)),
    template === undefined
      ? new EmptyContentEntry(FILE_NAME)
      : new StringContentEntry(FILE_NAME, JSON.stringify(template)),
    { ...Package.defaultOptions, ...options }
  );

  if (message !== undefined) {
    t.is(commit.message, message);
  }

  if (typeof expected === "function") {
    expected(t, JSON.parse(await commit.entry.getString()));
  } else {
    t.deepEqual(
      JSON.parse(await commit.entry.getString()),
      expected === undefined ? content : expected
    );
  }
}

pkgt.title = (
  providedTitle = "",
  template,
  content,
  options,
  expected,
  message = []
) =>
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
      url: "http://mock-provider.com/targetUser/targetRepo"
    },
    bugs: { url: "http://mock-provider.com/targetUser/targetRepo/issues" },
    homepage: "http://mock-provider.com/targetUser/targetRepo#readme",
    template: {
      inheritFrom: "templateRepo"
    }
  },
  undefined,
  undefined,
  "merge from template package.json"
);

test(
  "repository change only",
  pkgt,
  {},
  {
    homepage: "http://mock-provider.com/targetUser/targetRepo#readme",
    bugs: {
      url: "http://mock-provider.com/targetUser/targetRepo/issues"
    },
    template: {
      inheritFrom: "templateRepo"
    }
  },
  undefined,
  {
    name: "targetRepo",
    homepage: "http://mock-provider.com/targetUser/targetRepo#readme",
    bugs: {
      url: "http://mock-provider.com/targetUser/targetRepo/issues"
    },
    repository: {
      type: "git",
      url: "http://mock-provider.com/targetUser/targetRepo"
    },
    template: {
      inheritFrom: "templateRepo"
    }
  },
  "chore(package): (repository)"
);

test(
  "remove empty deps",
  pkgt,
  {
    dependencies: {},
    repository: {
      type: "git",
      url: "http://mock-provider.com/targetUser/targetRepo"
    }
  },
  {
    homepage: "http://mock-provider.com/targetUser/targetRepo#readme",
    bugs: {
      url: "http://mock-provider.com/targetUser/targetRepo/issues"
    },
    template: {
      inheritFrom: "templateRepo"
    }
  },
  undefined,
  {
    name: "targetRepo",
    homepage: "http://mock-provider.com/targetUser/targetRepo#readme",
    bugs: {
      url: "http://mock-provider.com/targetUser/targetRepo/issues"
    },
    repository: {
      type: "git",
      url: "http://mock-provider.com/targetUser/targetRepo"
    },
    template: {
      inheritFrom: "templateRepo"
    }
  },
  ["chore(package): (dependencies)", "chore(package): (repository)"].join("\n")
);

test(
  "package skip lower versions engines",
  pkgt,
  {
    engines: {
      node: ">=8"
    }
  },
  {
    engines: {
      node: ">=10"
    }
  },
  undefined,
  (t, merged) => {
    t.deepEqual(merged.engines, {
      node: ">=10"
    });
  }
);

test(
  "delete entries",
  pkgt,
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
  },
  undefined,
  (t, merged) => {
    t.deepEqual(merged.slot, {
      add: 2,
      preserve: 3
    });
  }
  /*
  t.false(merged.messages.includes("chore(package): delete other"));
  t.true(merged.messages.includes("chore(package): (slot.something)"));
*/
);

test(
  "package preserve extra prepare",
  pkgt,
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
  },
  undefined,
  (t, merged) => {
    t.deepEqual(merged.scripts, {
      prepare: "rollup x y && chmod +x bin/xx",
      preprocess: "rollup a && chmod +x bin/yy"
    });
  }
);

test(
  "package handle missing scripts in template",
  pkgt,
  {
    scripts: {
      prepare: "rollup"
    }
  },
  {},
  undefined,
  (t, merged) => {
    t.deepEqual(merged.scripts, {
      prepare: "rollup"
    });
  }
);

test(
  "package bin with expander",
  pkgt,
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
  },
  { properties: { name: "myName" } }, // TODO
  (t, merged) => {
    t.deepEqual(merged.bin, {
      a: "bin/a",
      myName: "bin/myName",
      "myName-systemd": "bin/myName-systemd"
    });
  }
);

test(
  "package devDependencies keep cracks",
  pkgt,
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
  },
  undefined,
  (t, merged) => {
    t.deepEqual(merged.devDependencies, {
      cracks: "3.1.2"
    });
  }
);

test(
  "package devDependencies remove cracks",
  pkgt,
  {
    devDependencies: {
      special: "1.0.0"
    }
  },
  {
    devDependencies: {
      cracks: "3.1.2",
      "dont-crack": "1.0.0"
    }
  },
  undefined,
  (t, merged) => {
    t.deepEqual(merged.devDependencies, { special: "1.0.0" });
  }
);

test(
  "package devDependencies",
  pkgt,
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
  },
  undefined,
  (t, merged) => {
    t.deepEqual(merged.devDependencies, {
      b: "1",
      c: "1",
      e: "2"
    });
  }
  //  merged.messages.includes("chore(package): remove 1 (devDependencies.a)") &&
  //    merged.messages.includes("chore(package): add 1 (devDependencies.c)")
);

test(
  "package dependencies only increase",
  pkgt,
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
  },
  undefined,
  (t, merged) => {
    t.deepEqual(merged.devDependencies, {
      a: "^0.25.1",
      b: "^1.0.0-beta.5.1",
      c: "0.25.0",
      d: "~0.24.9"
    });
  }
);

test(
  "package dependencies increase beta <> rc",
  pkgt,
  {
    devDependencies: {
      a: "^1.0.0-rc.1"
    }
  },
  {
    devDependencies: {
      a: "^1.0.0-beta.8"
    }
  },
  undefined,
  (t, merged) => {
    t.deepEqual(merged.devDependencies, {
      a: "^1.0.0-rc.1"
    });
  }
);

test(
  "package dependencies git",
  pkgt,
  {
    devDependencies: {
      a: "git+https://github.com/arlac77/light-server.git"
    }
  },
  {
    devDependencies: {
      a: "^1.0.0-rc.1"
    }
  },
  undefined,
  (t, merged) => {
    t.deepEqual(merged.devDependencies, {
      a: "git+https://github.com/arlac77/light-server.git"
    });
  }
);

test(
  "package keywords",
  pkgt,
  {},
  {
    name: "abc_xxx_1",
    template: {
      inheritFrom: "https://github.com/.git"
    },
    keywords: ["A", "B"]
  },
  {
    keywords: {
      _xxx_: "X"
    }
  },
  (t, merged) => {
    t.deepEqual(merged.keywords, ["A", "B", "X"]);
  }
  // .messages.includes("docs(package): add X (keywords)"));
);

test(
  "package keywords empty",
  pkgt,
  {},
  {
    name: "abc_xxx_1"
  },
  {
    keywords: {
      _xxx_: "XXX"
    }
  },
  (t, merged) => {
    t.deepEqual(merged.keywords, ["XXX"]);
  }

  //t.true(merged.messages.includes("docs(package): (keywords)"));
);

test(
  "package remove null keyword",
  pkgt,
  {
    template: {}
  },
  {
    name: "abc_xxx_1",
    keywords: [null, ""]
  },
  undefined,
  (t, merged) => {
    t.is(merged.keywords, undefined);
  }
  //t.true(merged.messages.includes("docs(package): remove  (keywords)"));
);

test(
  "package remove unexpanded {{xxx}}",
  pkgt,
  {
    template: {}
  },
  {
    browser: "{{browser}}",
    main: "a value"
  },
  undefined,
  (t, merged) => {
    t.true(merged.browser === undefined);
    t.true(merged.main === "a value");
  }
  //  "chore(package): remove unknown value for browser ({{browser}})"
);

test(
  "add xo/space=true",
  pkgt,
  {
    xo: {
      space: true
    }
  },
  {
    xo: {
      space: true
    }
  },
  undefined,
  (t, merged) => {
    t.deepEqual(merged.xo, {
      space: true
    });
  }
);

test(
  "jsonpath",
  pkgt,
  {
    nyc: {
      "report-dir": "./build/coverage"
    }
  },
  {
    nyc: {
      "report-dir": "./coverage"
    }
  },
  { actions: [{ path: "$.nyc['report-dir']", op: "replace" }] },
  (t, merged) => {
    t.deepEqual(merged.nyc, {
      "report-dir": "./build/coverage"
    });
  }
  //    "chore(package): add ./build/coverage (nyc.report-dir)"
);

test("package start fresh", pkgt, undefined, undefined, {
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
    inheritFrom: "templateRepo"
  }
});
