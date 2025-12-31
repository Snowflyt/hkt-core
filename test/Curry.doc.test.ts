import { describe, equal, expect, it } from "typroof";

import { beOfSig } from "@hkt-core/typroof-plugin";

import type {
  Apply,
  Arg0,
  Arg1,
  Arg2,
  Arg3,
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

  it("should curry a quaternary type-level function", () => {
    interface Zip4Str extends TypeLambda<
      [s1: string[], s2: string[], s3: string[], s4: string[]],
      string[]
    > {
      return: _Zip4Str<Arg0<this>, Arg1<this>, Arg2<this>, Arg3<this>>;
    }
    type _Zip4Str<A, B, C, D> =
      A extends readonly [infer AHead, ...infer ATail] ?
        B extends readonly [infer BHead, ...infer BTail] ?
          C extends readonly [infer CHead, ...infer CTail] ?
            D extends readonly [infer DHead, ...infer DTail] ?
              [
                `${AHead & string}${BHead & string}${CHead & string}${DHead & string}`,
                ..._Zip4Str<ATail, BTail, CTail, DTail>,
              ]
            : []
          : []
        : []
      : [];

    expect<Zip4Str>().to(
      beOfSig<(s1: string[], s2: string[], s3: string[], s4: string[]) => string[]>,
    );
    expect<Apply<Zip4Str, [["a", "b"], ["1", "2"], ["X", "Y"], ["!", "?"]]>>().to(
      equal<["a1X!", "b2Y?"]>,
    );

    type CurriedZip4Str = Curry<Zip4Str>;
    expect<CurriedZip4Str>().to(
      beOfSig<(s1: string[]) => (s2: string[]) => (s3: string[]) => (s4: string[]) => string[]>,
    );
    expect<Apply<CurriedZip4Str, [["a", "b"]]>>().to(
      beOfSig<(s2: string[]) => (s3: string[]) => (s4: string[]) => string[]>,
    );
    expect<Apply<Apply<CurriedZip4Str, [["a", "b"]]>, [["1", "2"]]>>().to(
      beOfSig<(s3: string[]) => (s4: string[]) => string[]>,
    );
    expect<Apply<Apply<Apply<CurriedZip4Str, [["a", "b"]]>, [["1", "2"]]>, [["X", "Y"]]>>().to(
      beOfSig<(s4: string[]) => string[]>,
    );
    expect<
      Apply<
        Apply<Apply<Apply<CurriedZip4Str, [["a", "b"]]>, [["1", "2"]]>, [["X", "Y"]]>,
        [["!", "?"]]
      >
    >().to(equal<["a1X!", "b2Y?"]>);

    interface Zip4 extends TypeLambdaG<["T", "U", "V", "W"]> {
      signature: (
        as: TArg<this, "T">[],
        bs: TArg<this, "U">[],
        cs: TArg<this, "V">[],
        ds: TArg<this, "W">[],
      ) => [TArg<this, "T">, TArg<this, "U">, TArg<this, "V">, TArg<this, "W">][];
      return: _Zip4<Arg0<this>, Arg1<this>, Arg2<this>, Arg3<this>>;
    }
    type _Zip4<T, U, V, W> =
      T extends readonly [infer AHead, ...infer ATail] ?
        U extends readonly [infer BHead, ...infer BTail] ?
          V extends readonly [infer CHead, ...infer CTail] ?
            W extends readonly [infer DHead, ...infer DTail] ?
              [[AHead, BHead, CHead, DHead], ..._Zip4<ATail, BTail, CTail, DTail>]
            : []
          : []
        : []
      : [];

    expect<Zip4>().to(beOfSig<<T, U, V, W>(as: T[], bs: U[], cs: V[], ds: W[]) => [T, U, V, W][]>);
    expect<Apply<Zip4, [[1, 2], ["a", "b"], [true, false], [0.1, 0.2]]>>().to(
      equal<[[1, "a", true, 0.1], [2, "b", false, 0.2]]>,
    );

    type CurriedZip4 = Curry<Zip4>;
    expect<CurriedZip4>().to(
      beOfSig<<T, U, V, W>(as: T[]) => (bs: U[]) => (cs: V[]) => (ds: W[]) => [T, U, V, W][]>,
    );
    expect<Apply<CurriedZip4, [[1, 2]]>>().to(
      beOfSig<
        (
          bs: unknown[],
        ) => (cs: unknown[]) => (ds: unknown[]) => [1 | 2, unknown, unknown, unknown][]
      >,
    );
    expect<Apply<Apply<CurriedZip4, [[1, 2]]>, [["a", "b"]]>>().to(
      beOfSig<(cs: unknown[]) => (ds: unknown[]) => [1 | 2, "a" | "b", unknown, unknown][]>,
    );
    expect<Apply<Apply<Apply<CurriedZip4, [[1, 2]]>, [["a", "b"]]>, [[true, false]]>>().to(
      beOfSig<(ds: unknown[]) => [1 | 2, "a" | "b", boolean, unknown][]>,
    );
    expect<
      Apply<Apply<Apply<Apply<CurriedZip4, [[1, 2]]>, [["a", "b"]]>, [[true, false]]>, [[0.1, 0.2]]>
    >().to(equal<[[1, "a", true, 0.1], [2, "b", false, 0.2]]>);
  });
});
