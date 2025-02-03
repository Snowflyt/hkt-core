import { equal, expect, test } from "typroof";

import type { Apply, Arg0, Arg1, TypeLambda } from "../src";

test("Apply", () => {
  interface ParseNumber extends TypeLambda<[n: string], number> {
    return: Arg0<this> extends `${infer N extends number}` ? N : never;
  }
  expect<Apply<ParseNumber, ["42"]>>().to(equal<42>);

  interface Concat extends TypeLambda<[s1: string, s2: string], string> {
    return: `${Arg0<this>}${Arg1<this>}`;
  }
  expect<Apply<Concat, ["foo", "bar"]>>().to(equal<"foobar">);
});
