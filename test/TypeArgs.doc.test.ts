import { equal, expect, test } from "typroof";

import type {
  Arg0,
  Arg1,
  Call1W,
  TArg,
  TypeArgs,
  TypeLambda,
  TypeLambda1,
  TypeLambdaG,
} from "../src";

test("TypeArgs", () => {
  interface Map extends TypeLambdaG<["T", "U"]> {
    signature: (
      f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
      xs: TArg<this, "T">[],
    ) => TArg<this, "U">[];
    return: _Map<Arg0<this>, Arg1<this>>;
  }
  type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

  expect<TypeArgs<Map, { 1: string[]; r: number[] }>>().to(
    equal<{ readonly "~T": string } & { readonly ["~U"]: number }>,
  );
  expect<TypeArgs<Map, [TypeLambda1<number, boolean>]>>().to(
    equal<{ readonly "~T": number } & { readonly ["~U"]: boolean }>,
  );
});
