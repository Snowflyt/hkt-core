import { describe, equal, expect, it } from "typroof";

import { beOfSig } from "@hkt-core/typroof-plugin";

import type { Apply, Arg0, Arg1, Call1W, Curry, Flip, TArg, TypeLambda, TypeLambdaG } from "../src";

describe("Flip", () => {
  interface Append<Suffix extends string> extends TypeLambda<[s: string], string> {
    return: `${Arg0<this>}${Suffix}`;
  }

  interface Map extends TypeLambdaG<["T", "U"]> {
    signature: (
      f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
      xs: TArg<this, "T">[],
    ) => TArg<this, "U">[];
    return: _Map<Arg0<this>, Arg1<this>>;
  }
  type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

  it("should flip the arguments of a binary type-level function", () => {
    expect<Map>().to(beOfSig<<T, U>(f: (x: T) => U, xs: T[]) => U[]>);
    expect<Apply<Map, [Append<"!">, ["foo", "bar"]]>>().to(equal<["foo!", "bar!"]>);

    type FlippedMap = Flip<Map>;
    expect<FlippedMap>().to(beOfSig<<T, U>(xs: T[], f: (x: T) => U) => U[]>);
    expect<Apply<FlippedMap, [["foo", "bar"], Append<"!">]>>().to(equal<["foo!", "bar!"]>);
  });

  it("should flip the arguments of a curried binary type-level function", () => {
    type CurriedMap = Curry<Map>;

    expect<CurriedMap>().to(beOfSig<<T, U>(f: (x: T) => U) => (xs: T[]) => U[]>);
    expect<Apply<CurriedMap, [Append<"!">]>>().to(beOfSig<(xs: string[]) => string[]>);
    expect<Apply<Apply<CurriedMap, [Append<"!">]>, [["foo", "bar"]]>>().to(equal<["foo!", "bar!"]>);

    type FlippedCurriedMap = Flip<CurriedMap>;

    expect<FlippedCurriedMap>().to(beOfSig<<T, U>(xs: T[]) => (f: (x: T) => U) => U[]>);
    expect<Apply<FlippedCurriedMap, [string[]]>>().to(
      beOfSig<(f: (x: string) => unknown) => unknown[]>,
    );
    expect<Apply<Apply<FlippedCurriedMap, [["foo", "bar"]]>, [Append<"!">]>>().to(
      equal<["foo!", "bar!"]>,
    );
  });
});
