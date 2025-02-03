import { equal, expect, test } from "typroof";

import type { Arg0, Arg1, ParamsLength, TypeLambda } from "../src";

test("ParamsLength", () => {
  interface Concat extends TypeLambda<[s1: string, s2: string], string> {
    return: `${Arg0<this>}${Arg1<this>}`;
  }

  expect<ParamsLength<Concat>>().to(equal<2>);
});
