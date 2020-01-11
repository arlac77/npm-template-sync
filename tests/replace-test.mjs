import test from "ava";
import { createContext } from "./util.mjs";
import { Replace } from "../src/replace.mjs";

test("replace", async t => {
  const context = await createContext(
    `Line 1x
Line 2x`,
    `Line 1
Line 2`,
    "aFile"
  );

  const replace = new Replace("aFile");
  const merged = await replace.merge(context);
  t.deepEqual(
    merged.content,
    `Line 1x
Line 2x`
  );
});
