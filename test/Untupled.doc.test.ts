import { beOfSig } from "@hkt-core/typroof-plugin";
import { equal, expect, test } from "typroof";

import type { Apply, Arg0, TArg, TypeLambdaG, Untupled } from "../src";

test("Untupled", () => {
  interface First extends TypeLambdaG<["T"]> {
    signature: (pair: [TArg<this, "T">, unknown]) => TArg<this, "T">;
    return: Arg0<this>[0];
  }

  expect<First>().to(beOfSig<<T>(pair: [T, unknown]) => T>);
  expect<Apply<First, [[42, "foo"]]>>().to(equal<42>);

  type UntupledFirst = Untupled<First>;
  expect<UntupledFirst>().to(beOfSig<<T>(args_0: T, args_1: unknown) => T>);
  expect<Apply<UntupledFirst, [42, "foo"]>>().to(equal<42>);
});
