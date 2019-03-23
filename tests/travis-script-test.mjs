import test from "ava";
import { merge } from "../src/travis";

const templateFragment = {
  language: "node_js",
  jobs: {
    include: {
      script: [
        "cat ./coverage/lcov.info | coveralls",
        "npm install -g --production codecov",
        "npm test",
        "-npm install -g --production coveralls codecov"
      ]
    }
  }
};

test("travis scripts", t => {
  const originalFragment = {
    jobs: {
      include: {
        script: ["npm install -g --production coveralls codecov", "npm test"]
      }
    }
  };

/*
  console.log(
    "XX",
    JSON.stringify(merge(originalFragment, templateFragment), {
      language: "node_js",
      jobs: {
        include: {
          script: [
            "npm test",
            "cat ./coverage/lcov.info | coveralls",
            "npm install -g --production codecov"
          ]
        }
      }
    })
  );
*/

  const messages = [];
  t.deepEqual(merge(originalFragment, templateFragment, undefined, messages), {
    language: "node_js",
    jobs: {
      include: {
        script: [
          "npm test",
          "cat ./coverage/lcov.info | coveralls",
          "npm install -g --production codecov"
        ]
      }
    }
  });

  t.deepEqual(messages, [
    "chore(travis): add cat ./coverage/lcov.info | coveralls to jobs.include.script",
    "chore(travis): add npm install -g --production codecov to jobs.include.script",
    "chore(travis): remove npm install -g --production coveralls codecov from jobs.include.script",
    "chore(travis): language=node_js"
  ]);
});

test("merge objects", t => {
  const messages = [];

  t.deepEqual(
    merge({ a: "AA", c: "CC" }, { b: "BB", c: "CCC" }, undefined, messages),
    {
      a: "AA",
      b: "BB",
      c: "CCC"
    }
  );
});

test("merge versions", t => {
  const messages = [];

  t.deepEqual(
    merge({ node_js: ["1.0"] }, { node_js: ["2.0"] }, undefined, messages),
    {
      node_js: ["1.0", "2.0"]
    }
  );
});
