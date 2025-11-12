import { describe, equal, expect, it } from "typroof";

import { beOfSig } from "@hkt-core/typroof-plugin";

import type {
  Apply,
  ApplyW,
  Arg0,
  Arg1,
  Arg2,
  Call1W,
  Call2W,
  PartialApply,
  Sig,
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

    type Concat_ = PartialApply<Concat, []>;
    expect<Concat_>().to(beOfSig<(s1: string, s2: string) => string>);
    expect<Concat_>().to(beOfSig<Sig<Concat>>);
    expect<Apply<Concat_, ["Hello, ", "world!"]>>().to(equal<"Hello, world!">);

    type Greet = PartialApply<Concat, ["Hello, "]>;
    expect<Greet>().to(beOfSig<(s2: string) => string>);
    expect<Apply<Greet, ["world!"]>>().to(equal<"Hello, world!">);

    type SayWorld = PartialApply<Concat, { 1: "world!" }>;
    expect<SayWorld>().to(beOfSig<(s1: string) => string>);
    expect<Apply<SayWorld, ["Hello, "]>>().to(equal<"Hello, world!">);

    type HelloWorld = PartialApply<Concat, ["Hello, ", "world!"]>;
    expect<HelloWorld>().to(beOfSig<() => string>);
    expect<Apply<HelloWorld, []>>().to(equal<"Hello, world!">);
  });

  it("should partially apply generic type-level functions", () => {
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

    type Map_ = PartialApply<Map, []>;
    expect<Map_>().to(beOfSig<<T, U>(f: (x: T) => U, xs: T[]) => U[]>);
    expect<Map_>().to(beOfSig<Sig<Map>>);
    expect<Apply<Map_, [Append<"!">, ["foo", "bar"]]>>().to(equal<["foo!", "bar!"]>);

    type ShoutMap = PartialApply<Map, [Append<"!">]>;
    expect<ShoutMap>().to(beOfSig<(xs: string[]) => string[]>);
    expect<Apply<ShoutMap, [["foo", "bar"]]>>().to(equal<["foo!", "bar!"]>);

    type MapFooBar = PartialApply<Map, { 1: ["foo", "bar"] }>;
    expect<MapFooBar>().to(beOfSig<<T>(f: (x: "foo" | "bar") => T) => T[]>);
    expect<Apply<MapFooBar, [Append<"!">]>>().to(equal<["foo!", "bar!"]>);

    type ShoutFooBar = PartialApply<Map, [Append<"!">, ["foo", "bar"]]>;
    expect<ShoutFooBar>().to(beOfSig<() => string[]>);
    expect<Apply<ShoutFooBar, []>>().to(equal<["foo!", "bar!"]>);

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

    type Reduce_ = PartialApply<Reduce, []>;
    expect<Reduce_>().to(beOfSig<<T, U>(f: (acc: U, x: T) => U, init: U, xs: T[]) => U>);
    expect<Reduce_>().to(beOfSig<Sig<Reduce>>);
    expect<Apply<Reduce_, [Concat, "", ["foo", "bar", "baz"]]>>().to(equal<"foobarbaz">);

    type ConcatReduce = PartialApply<Reduce, [Concat]>;
    expect<ConcatReduce>().to(beOfSig<(init: string, xs: string[]) => string>);
    expect<Apply<ConcatReduce, ["", ["foo", "bar", "baz"]]>>().to(equal<"foobarbaz">);

    type ReduceWithEmptyString = PartialApply<Reduce, { 1: "" }>;
    expect<ReduceWithEmptyString>().to(beOfSig<<T>(f: (acc: "", x: T) => "", xs: T[]) => "">);
    expect<ApplyW<ReduceWithEmptyString, [Concat, ["foo", "bar", "baz"]]>>().to(equal<"foobarbaz">);

    type ReduceFooBarBaz = PartialApply<Reduce, { 2: ["foo", "bar", "baz"] }>;
    expect<ReduceFooBarBaz>().to(
      beOfSig<<T>(f: (acc: T, x: "foo" | "bar" | "baz") => T, init: T) => T>,
    );
    expect<ApplyW<ReduceFooBarBaz, [Concat, ""]>>().to(equal<"foobarbaz">);

    type ConcatAll = PartialApply<Reduce, [Concat, ""]>;
    expect<ConcatAll>().to(beOfSig<(xs: string[]) => string>);
    expect<Apply<ConcatAll, [["foo", "bar", "baz"]]>>().to(equal<"foobarbaz">);

    type ConcatFooBarBaz = PartialApply<Reduce, [Concat, "", ["foo", "bar", "baz"]]>;
    expect<ConcatFooBarBaz>().to(beOfSig<() => string>);
    expect<Apply<ConcatFooBarBaz, []>>().to(equal<"foobarbaz">);
  });
});
