import { equal, expect, test } from "typroof";

import type { Arg0, Arg1, Call1W, TArg, TolerantParams, TypeLambda, TypeLambdaG } from "../src";

test("TolerantParams", () => {
  interface Map extends TypeLambdaG<["T", "U"]> {
    signature: (
      f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
      xs: TArg<this, "T">[],
    ) => TArg<this, "U">[];
    return: _Map<Arg0<this>, Arg1<this>>;
  }
  type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

  expect<TolerantParams<Map>>().to(equal<[f: TypeLambda<[x: never], unknown>, xs: unknown[]]>);
});
