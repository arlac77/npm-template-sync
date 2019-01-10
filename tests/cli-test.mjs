import test from "ava";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import execa from "execa";

const here = dirname(fileURLToPath(import.meta.url));

const nts = join(here, "..", "bin", "npm-template-sync");

test("cli defines", async t => {
  const c = await execa(nts, ["-d", "test=test string", "--list-properties"]);
  t.truthy(c.stdout.match(/test string/));
});

test("cli dryrun", async t => {
  const c = await execa(nts, ["--dry", "arlac77/config-expander"]);

  /*
  console.log(c.stdout);
  console.log(c.stderr);
*/
  t.is(c.code, 0);
});

test("cli list properties", async t => {
  const c = await execa(nts, ["--list-properties", "arlac77/config-expander"]);
  t.truthy(c.stdout.match(/Expands expressions in config files/));

  t.is(c.code, 0);
});
