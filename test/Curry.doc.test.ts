import { describe, equal, expect, it } from "typroof";

import { beOfSig } from "@hkt-core/typroof-plugin";

import type {
  Apply,
  Arg0,
  Arg1,
  Arg2,
  Call1W,
  Call2W,
  Curry,
  TArg,
  TypeLambda,
  TypeLambdaG,
} from "../src";

describe("Curry", () => {
  it("should curry a binary type-level function", () => {
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

    expect<Map>().to(beOfSig<<T, U>(f: (x: T) => U, xs: T[]) => U[]>);
    expect<Apply<Map, [Append<"!">, ["foo", "bar"]]>>().to(equal<["foo!", "bar!"]>);

    type CurriedMap = Curry<Map>;
    expect<CurriedMap>().to(beOfSig<<T, U>(f: (x: T) => U) => (xs: T[]) => U[]>);
    expect<Apply<CurriedMap, [Append<"!">]>>().to(beOfSig<(xs: string[]) => string[]>);
    expect<Apply<Apply<CurriedMap, [Append<"!">]>, [["foo", "bar"]]>>().to(equal<["foo!", "bar!"]>);
  });

  it("should curry a ternary type-level function", () => {
    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      return: `${Arg0<this>}${Arg1<this>}`;
    }

    interface Reduce extends TypeLambdaG<["T", "U"]> {
      signature: (
        f: TypeLambda<[acc: TArg<this, "U">, x: TArg<this, "T">], TArg<this, "U">>,
        init: TArg<this, "U">,
        xs: TArg<this, "T">[],
      ) => TArg<this, "U">;
      return: _Reduce<Arg0<this>, Arg1<this>, Arg2<this>>;
    }
    type _Reduce<F, Acc, TS> =
      TS extends readonly [infer Head, ...infer Tail] ? _Reduce<F, Call2W<F, Acc, Head>, Tail>
      : Acc;

    expect<Reduce>().to(beOfSig<<T, U>(f: (acc: U, x: T) => U, init: U, xs: T[]) => U>);
    expect<Apply<Reduce, [Concat, "", ["foo", "bar", "baz"]]>>().to(equal<"foobarbaz">);

    type CurriedReduce = Curry<Reduce>;
    expect<CurriedReduce>().to(
      beOfSig<<T, U>(f: (acc: U, x: T) => U) => (init: U) => (xs: T[]) => U>,
    );
    expect<Apply<CurriedReduce, [Concat]>>().to(
      beOfSig<(init: string) => (xs: string[]) => string>,
    );
    expect<Apply<Apply<CurriedReduce, [Concat]>, [""]>>().to(beOfSig<(xs: string[]) => string>);
    expect<Apply<Apply<Apply<CurriedReduce, [Concat]>, [""]>, [["foo", "bar", "baz"]]>>().to(
      equal<"foobarbaz">,
    );
  });
});
