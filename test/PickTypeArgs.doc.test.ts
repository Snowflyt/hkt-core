import { expect, test } from "typroof";

import { beOfSig } from "@hkt-core/typroof-plugin";

import type {
  Arg0,
  Call1W,
  Identity,
  Param0,
  PickTypeArgs,
  RetType,
  TypeLambda,
  TypeLambda1,
} from "../src";

test("PickTypeArgs", () => {
  interface Map<F extends TypeLambda1> extends TypeLambda {
    "~hkt": F["~hkt"];
    signature: (xs: Param0<F & PickTypeArgs<this>>[]) => RetType<F & PickTypeArgs<this>>[];
    return: _Map<Arg0<this>, F>;
  }
  type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

  expect<Map<Identity>>().to(beOfSig<<T>(xs: T[]) => T[]>);

  interface ParseNumber extends TypeLambda<[s: string], number> {
    return: Arg0<this> extends `${infer N extends number}` ? N : never;
  }

  expect<Map<ParseNumber>>().to(beOfSig<(xs: string[]) => number[]>);
});
