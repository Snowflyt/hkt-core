import { equal, expect, test } from "typroof";

import type { Arg0, Arg1, Params, TypeLambda } from "../src";

test("Params", () => {
  interface Concat extends TypeLambda<[s1: string, s2: string], string> {
    return: `${Arg0<this>}${Arg1<this>}`;
  }

  expect<Params<Concat>>().to(equal<[s1: string, s2: string]>);
});
