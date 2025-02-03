import { beOfSig } from "@hkt-core/typroof-plugin";
import { equal, expect, test } from "typroof";

import type { Apply, Arg0, Ask, Flow, TArg, TypeLambdaG } from "../src";

test("TypeLambdaG", () => {
  interface MakeTuple extends TypeLambdaG<["T"]> {
    signature: (value: TArg<this, "T">) => [TArg<this, "T">];
    return: [Arg0<this>];
  }

  expect<MakeTuple>().to(beOfSig<<T>(value: T) => [T]>);
  expect<Apply<MakeTuple, [42]>>().to(equal<[42]>);

  type WrapStringTuple = Flow<Ask<string>, MakeTuple>;
  expect<WrapStringTuple>().to(beOfSig<(value: string) => [string]>);
  expect<Apply<WrapStringTuple, ["foo"]>>().to(equal<["foo"]>);
});
