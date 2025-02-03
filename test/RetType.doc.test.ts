import { equal, expect, test } from "typroof";

import type { Arg0, Arg1, RetType, TypeLambda } from "../src";

test("RetType", () => {
  interface Concat extends TypeLambda<[s1: string, s2: string], string> {
    return: `${Arg0<this>}${Arg1<this>}`;
  }

  expect<RetType<Concat>>().to(equal<string>);
});
