import { equal, expect, test } from "typroof";

import { beOfSig } from "@hkt-core/typroof-plugin";

import type { Apply, Ask, Flow, Identity } from "../src";

test("Ask", () => {
  type AskNumber = Ask<number>;
  expect<AskNumber>().to(beOfSig<(value: number) => number>);
  expect<Apply<AskNumber, [42]>>().to(equal<42>);

  // Fix the input type of `Identity` to `string`
  type AskString = Flow<Ask<string>, Identity>;
  expect<AskString>().to(beOfSig<(value: string) => string>);
  expect<Apply<AskString, ["foo"]>>().to(equal<"foo">);
});
