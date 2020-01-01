import test from "ava";
import { MockProvider } from "mock-repository-provider";

import { Context } from "../src/context.mjs";
import { PreparedContext } from "../src/prepared-context.mjs";
import { License } from "../src/license.mjs";

async function lmt(t, license, year = 2099, expected = "", messages = []) {
  const provider = new MockProvider({
    templateRepo: {
      master: { aFile: "Copyright (c) {{date.year}} by {{license.owner}}" }
    },
    "myOwner/targetRepo": { master: { aFile: license } }
  });

  const context = await PreparedContext.from(
    new Context(provider, {
      templateBranchName: "templateRepo",
      properties: {
        date: { year },
        license: { owner: "xyz" }
      }
    }),
    "myOwner/targetRepo"
  );

  const lf = new License("aFile");
  const merged = await lf.merge(context);
  t.deepEqual(merged.messages, messages);
  t.deepEqual(merged.content, expected);
}

lmt.title = (
  providedTitle = "",
  license,
  year = 2099,
  expected = "",
  messages = []
) => `license ${providedTitle} ${license} ${expected}`.trim();

test(lmt, "Copyright (c) 1999 by xyz", 2099, "Copyright (c) 1999,2099 by xyz", [
  "chore(license): add year 2099"
]);

test(
  lmt,
  "Copyright (c) 2001,1999,2000,2001,2007 by xyz",
  2099,
  "Copyright (c) 1999,2000,2001,2007,2099 by xyz",
  ["chore(license): add year 2099"]
);


test(
  lmt,
  undefined,
  2099,
  "Copyright (c) 2099 by myOwner",
  ["chore(license): add LICENSE"]
);
