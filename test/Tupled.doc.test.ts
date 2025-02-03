import { beOfSig } from "@hkt-core/typroof-plugin";
import { equal, expect, test } from "typroof";

import type { Apply, Arg0, Arg1, Tupled, TypeLambda } from "../src";

test("Tupled", () => {
  interface Add extends TypeLambda<[a: number, b: number], number> {
    return: [..._BuildTuple<Arg0<this>>, ..._BuildTuple<Arg1<this>>]["length"];
  }
  type _BuildTuple<Length extends number, Fill = void, Acc extends Fill[] = []> =
    [Length] extends [never] ? never
    : Acc["length"] extends Length ? Acc
    : _BuildTuple<Length, Fill, [...Acc, Fill]>;

  expect<Add>().to(beOfSig<(a: number, b: number) => number>);

  type TupledAdd = Tupled<Add>;
  expect<TupledAdd>().to(beOfSig<(args: [a: number, b: number]) => number>);
  expect<Apply<TupledAdd, [[1, 2]]>>().to(equal<3>);
});
