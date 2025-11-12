import { describe, equal, expect, it } from "typroof";

import { beOfSig } from "@hkt-core/typroof-plugin";

import type {
  Apply,
  Arg0,
  Arg1,
  Arg2,
  Call2W,
  PartialApply,
  TArg,
  TypeLambda,
  TypeLambdaG,
} from "../src";

describe("PartialApply", () => {
  it("should partially apply non-generic type-level functions", () => {
    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      return: `${Arg0<this>}${Arg1<this>}`;
    }

    expect<Concat>().to(beOfSig<(s1: string, s2: string) => string>);
    expect<Apply<Concat, ["Hello, ", "world!"]>>().to(equal<"Hello, world!">);

    type Greet = PartialApply<Concat, ["Hello, "]>;
    expect<Greet>().to(beOfSig<(s2: string) => string>);
    expect<Apply<Greet, ["world!"]>>().to(equal<"Hello, world!">);

    type SayWorld = PartialApply<Concat, { 1: "world!" }>;
    expect<SayWorld>().to(beOfSig<(s1: string) => string>);
    expect<Apply<SayWorld, ["Hello, "]>>().to(equal<"Hello, world!">);
  });

  it("should partially apply generic type-level functions", () => {
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

    type ConcatAll = PartialApply<Reduce, [Concat, ""]>;
    expect<ConcatAll>().to(beOfSig<(xs: string[]) => string>);
    expect<Apply<ConcatAll, [["foo", "bar", "baz"]]>>().to(equal<"foobarbaz">);

    type ReduceFooBarBaz = PartialApply<Reduce, { 2: ["foo", "bar", "baz"] }>;
    expect<ReduceFooBarBaz>().to(
      beOfSig<<T>(f: (acc: T, x: "foo" | "bar" | "baz") => T, init: T) => T>,
    );
    expect<Apply<ReduceFooBarBaz, [Concat, ""]>>().to(equal<"foobarbaz">);
  });
});
