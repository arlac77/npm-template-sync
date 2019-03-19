import test from "ava";
import { merge } from "../src/travis";

test("travis merge scalars", t => {
  const messages = [];

  t.deepEqual(
    merge(
      {
        "string": "abc",
        "boolean": true,
        "number" : 123,
        "bigint" : 123n,
        x1 : null
      },
      {
        "string": "abc",
        "boolean": true,
        "number" : 123,
        "bigint" : 123n,
        x1 : null
      },
      undefined,
      messages
    ),
    {
        "string": "abc",
        "boolean": true,
        "number" : 123,
        "bigint" : 123n,
        x1 : null
    }
  );

  t.deepEqual(messages, [
  ]);
});

