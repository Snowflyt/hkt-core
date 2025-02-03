import { beOfSig } from "@hkt-core/typroof-plugin";
import { equal, expect, test } from "typroof";

import type {
  Arg0,
  Arg1,
  Call1W,
  Curry,
  TArg,
  TolerantRetType,
  TypeLambda,
  TypeLambdaG,
} from "../src";

test("TolerantRetType", () => {
  interface Map extends TypeLambdaG<["T", "U"]> {
    signature: (
      f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
      xs: TArg<this, "T">[],
    ) => TArg<this, "U">[];
    return: _Map<Arg0<this>, Arg1<this>>;
  }
  type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

  type CurriedMap = Curry<Map>;
  expect<CurriedMap>().to(beOfSig<<T, U>(f: (x: T) => U) => (xs: T[]) => U[]>);

  expect<TolerantRetType<CurriedMap>>().to(equal<TypeLambda<[xs: never[]], unknown[]>>);
});
