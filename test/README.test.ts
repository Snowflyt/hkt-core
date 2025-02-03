import { beOfSig } from "@hkt-core/typroof-plugin";
import { filter, map } from "fp-ts/Array";
import { pipe } from "fp-ts/function";
import { beNever, equal, error, expect, test } from "typroof";

import type {
  Always,
  Apply,
  ApplyW,
  Arg0,
  Arg1,
  Arg2,
  Args,
  Ask,
  Call1,
  Call1W,
  Call2,
  Call2W,
  Call3,
  Compose,
  Curry,
  Flip,
  Flow,
  HKT,
  Identity,
  Kind,
  Param0,
  Params,
  Pipe,
  RawArg0,
  RawArg1,
  RetType,
  Sig,
  TArg,
  TolerantParams,
  TolerantRetType,
  Tupled,
  TypeArgs,
  TypeLambda,
  TypeLambda0,
  TypeLambda1,
  TypeLambdaG,
  Untupled,
} from "../src";

test("Quickstart > Use as classical HKTs 🐱", () => {
  type Option<T> = { _tag: "Some"; value: T } | { _tag: "None" };
  const some = <T>(value: T): Option<T> => ({ _tag: "Some", value });
  const none: Option<never> = { _tag: "None" };

  {
    const arrayMonad = {
      of: <T>(a: T) => [a],
      flatMap: <T, U>(fa: T[], f: (a: T) => U[]) => fa.flatMap(f),
    };

    const optionMonad = {
      of: some,
      flatMap: <T, U>(fa: Option<T>, f: (a: T) => Option<U>) =>
        fa._tag === "Some" ? f(fa.value) : none,
    };

    const flattenArray = <T>(ffa: T[][]): T[] => arrayMonad.flatMap(ffa, (x) => x);
    const flattenOption = <T>(ffa: Option<Option<T>>): Option<T> =>
      optionMonad.flatMap(ffa, (x) => x);
  }

  {
    interface MonadTypeClass<F extends HKT> {
      of: <T>(a: T) => Kind<F, T>;
      flatMap: <T, U>(fa: Kind<F, T>, f: (a: T) => Kind<F, U>) => Kind<F, U>;
    }

    const createFlatten =
      <F extends HKT>(monad: MonadTypeClass<F>) =>
      <T>(ffa: Kind<F, Kind<F, T>>): Kind<F, T> =>
        monad.flatMap(ffa, (x) => x);

    interface ArrayHKT extends HKT {
      return: Arg0<this>[];
    }
    const arrayMonad: MonadTypeClass<ArrayHKT> = {
      of: (a) => [a],
      flatMap: (fa, f) => fa.flatMap(f),
    };

    interface OptionHKT extends HKT {
      return: Option<Arg0<this>>;
    }
    const optionMonad: MonadTypeClass<OptionHKT> = {
      of: some,
      flatMap: (fa, f) => (fa._tag === "Some" ? f(fa.value) : none),
    };

    expect(createFlatten(arrayMonad)).to(equal<<T>(ffa: T[][]) => T[]>);
    expect(createFlatten(optionMonad)).to(equal<<T>(ffa: Option<Option<T>>) => Option<T>>);
  }
});

test("Quickstart > Use as type-level functions ✨", () => {
  const capitalize = (s: string) => (s.length > 0 ? s[0].toUpperCase() + s.slice(1) : "");

  {
    const concatNames = (names: string[]) =>
      names
        .filter((name) => name.length > 2)
        .map(capitalize)
        .join(", ");

    expect(concatNames).to(equal<(names: string[]) => string>);
  }

  {
    const joinBy = (sep: string) => (strings: string[]) => strings.join(sep);

    const concatNames = (names: string[]) =>
      pipe(
        names,
        filter((name) => name.length > 2),
        map(capitalize),
        joinBy(", "),
      );

    expect(concatNames).to(equal<(names: string[]) => string>);
  }

  type Names = ["alice", "bob", "i", "charlie"];

  {
    type FilterOutShortNames<Names extends string[]> =
      Names extends [infer Head extends string, ...infer Tail extends string[]] ?
        Head extends `${infer A}${infer B}${infer C}` ?
          "" extends A | B | C ?
            FilterOutShortNames<Tail>
          : [Head, ...FilterOutShortNames<Tail>]
        : FilterOutShortNames<Tail>
      : [];

    type CapitalizeNames<Names extends string[]> = {
      [K in keyof Names]: Capitalize<Names[K]>;
    };

    type JoinNames<Names extends string[]> =
      Names extends [infer Head extends string, ...infer Tail extends string[]] ?
        Tail extends [] ?
          Head
        : `${Head}, ${JoinNames<Tail>}`
      : "";

    type ConcatNames<Names extends string[]> = JoinNames<
      CapitalizeNames<FilterOutShortNames<Names>>
    >;

    expect<ConcatNames<Names>>().to(equal<"Alice, Bob, Charlie">);
  }

  {
    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      return: `${Arg0<this>}${Arg1<this>}`;
    }

    expect<Concat>().to(beOfSig<(s1: string, s2: string) => string>);

    expect<Apply<Concat, ["Hello", "World"]>>().to(equal<"HelloWorld">);
    expect<Call2<Concat, "foo", "bar">>().to(equal<"foobar">);

    // @ts-expect-error
    expect<Apply<Concat, ["foo", 42]>>().to(error);
    // @ts-expect-error
    expect<Call2<Concat, "foo", 42>>().to(error);
  }

  {
    interface ConcatFoo extends TypeLambda<[s: string], string> {
      return: `${Arg0<this>}foo`;
    }
    interface ConcatBar extends TypeLambda<[s: string], string> {
      return: `${Arg0<this>}bar`;
    }

    type Composed = Flow<ConcatFoo, ConcatBar>;
    expect<Composed>().to(beOfSig<(s: string) => string>);
    expect<Call1<Composed, "hello">>().to(equal<"hellofoobar">);

    type ConcatFooBar<S extends string> = Pipe<S, ConcatFoo, ConcatBar>;
    expect<ConcatFooBar<"hello">>().to(equal<"hellofoobar">);

    interface Add1 extends TypeLambda<[n: number], number> {
      return: [..._BuildTuple<Arg0<this>, void>, void]["length"];
    }
    type _BuildTuple<Length extends number, Fill, Acc extends Fill[] = []> =
      [Length] extends [never] ? never
      : Acc["length"] extends Length ? Acc
      : _BuildTuple<Length, Fill, [...Acc, Fill]>;

    // @ts-expect-error
    expect<Flow<ConcatFoo, Add1, ConcatBar>>().to(error);
    // @ts-expect-error
    expect<Pipe<S, ConcatFoo, ConcatBar, Add1>>().to(error);
  }

  {
    /* Define utility type-level functions */
    interface NotExtend<U> extends TypeLambda<[x: unknown], boolean> {
      return: [Arg0<this>] extends [U] ? false : true;
    }

    interface StringLength extends TypeLambda<[s: string], number> {
      return: _StringLength<Arg0<this>>;
    }
    type _StringLength<S extends string, Acc extends void[] = []> =
      S extends `${string}${infer Tail}` ? _StringLength<Tail, [...Acc, void]> : Acc["length"];

    interface CapitalizeString extends TypeLambda<[s: string], string> {
      return: Capitalize<Arg0<this>>;
    }

    /* Define type-level functions for filtering, mapping and joining */
    interface Filter<F extends TypeLambda1<never, boolean>>
      extends TypeLambda<[xs: Param0<F>[]], Param0<F>[]> {
      return: _Filter<F, Arg0<this>>;
    }
    type _Filter<F, TS, Acc extends unknown[] = []> =
      TS extends [infer Head, ...infer Tail] ?
        Call1W<F, Head> extends true ?
          _Filter<F, Tail, [...Acc, Head]>
        : _Filter<F, Tail, Acc>
      : Acc;

    interface Map<F extends TypeLambda1> extends TypeLambda<[xs: Param0<F>[]], RetType<F>[]> {
      return: _Map<F, Arg0<this>>;
    }
    type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

    interface JoinBy<Sep extends string> extends TypeLambda<[strings: string[]], string> {
      return: Arg0<this> extends [infer S extends string] ? S
      : Arg0<this> extends [infer Head extends string, ...infer Tail extends string[]] ?
        `${Head}${Sep}${Call1<JoinBy<Sep>, Tail>}`
      : "";
    }

    /* We can use either `Flow` or `Pipe` to compose type-level functions */
    type ConcatNamesFn = Flow<
      Filter<Flow<StringLength, NotExtend<1 | 2>>>,
      Map<CapitalizeString>,
      JoinBy<", ">
    >;
    expect<ConcatNamesFn>().to(beOfSig<(xs: string[]) => string>);

    type ConcatNames<Names extends string[]> = Pipe<
      Names,
      Filter<Flow<StringLength, NotExtend<1 | 2>>>,
      Map<CapitalizeString>,
      JoinBy<", ">
    >;

    /* Test the results! */
    expect<Call1<ConcatNamesFn, Names>>().to(equal<"Alice, Bob, Charlie">);
    expect<ConcatNames<Names>>().to(equal<"Alice, Bob, Charlie">);
  }
});

test("Documentation > Generic type-level functions", () => {
  {
    /* Types used in previous examples */
    interface NotExtend<U> extends TypeLambda<[x: unknown], boolean> {
      return: [Arg0<this>] extends [U] ? false : true;
    }

    interface StringLength extends TypeLambda<[s: string], number> {
      return: _StringLength<Arg0<this>>;
    }
    type _StringLength<S extends string, Acc extends void[] = []> =
      S extends `${string}${infer Tail}` ? _StringLength<Tail, [...Acc, void]> : Acc["length"];

    interface CapitalizeString extends TypeLambda<[s: string], string> {
      return: Capitalize<Arg0<this>>;
    }

    interface Filter<F extends TypeLambda1<never, boolean>>
      extends TypeLambda<[xs: Param0<F>[]], Param0<F>[]> {
      return: _Filter<F, Arg0<this>>;
    }
    type _Filter<F, TS, Acc extends unknown[] = []> =
      TS extends [infer Head, ...infer Tail] ?
        Call1W<F, Head> extends true ?
          _Filter<F, Tail, [...Acc, Head]>
        : _Filter<F, Tail, Acc>
      : Acc;

    interface Map<F extends TypeLambda1> extends TypeLambda<[xs: Param0<F>[]], RetType<F>[]> {
      return: _Map<F, Arg0<this>>;
    }
    type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

    interface JoinBy<Sep extends string> extends TypeLambda<[strings: string[]], string> {
      return: Arg0<this> extends [infer S extends string] ? S
      : Arg0<this> extends [infer Head extends string, ...infer Tail extends string[]] ?
        `${Head}${Sep}${Call1<JoinBy<Sep>, Tail>}`
      : "";
    }
    /* end */

    type Names = ["alice", "bob", "i", "charlie", "david"];

    type _Take<TS extends unknown[], N extends number, Counter extends void[] = []> =
      TS extends [infer Head, ...infer Tail] ?
        Counter["length"] extends N ?
          []
        : [Head, ..._Take<Tail, N, [...Counter, void]>]
      : [];

    interface TakeNonGeneric<N extends number> extends TypeLambda<[values: any[]], any[]> {
      return: _Take<Arg0<this>, N>;
    }
    expect<TakeNonGeneric<3>>().to(beOfSig<(values: any[]) => any[]>);

    interface Append<Suffix extends string> extends TypeLambda<[s: string], string> {
      return: `${Arg0<this>}${Suffix}`;
    }

    type ConcatNamesNonGeneric1 = Flow<
      Filter<Flow<StringLength, NotExtend<1 | 2>>>,
      TakeNonGeneric<3>,
      Map<CapitalizeString>,
      JoinBy<", ">,
      Append<", ...">
    >;
    expect<Call1<ConcatNamesNonGeneric1, Names>>().to(equal<"Alice, Bob, Charlie, ...">);

    interface RepeatString<S extends string> extends TypeLambda<[n: number], string> {
      return: _RepeatString<S, Arg0<this>>;
    }
    type _RepeatString<S extends string, Times extends number, Counter extends void[] = []> =
      [Times] extends [never] ? never
      : Counter["length"] extends Times ? ""
      : `${S}${_RepeatString<S, Times, [...Counter, void]>}`;

    type ConcatNamesNonGeneric2 = Flow<
      Filter<Flow<StringLength, NotExtend<1 | 2>>>,
      TakeNonGeneric<3>,
      Map<RepeatString<"foo">>,
      JoinBy<", ">,
      Append<", ...">
    >;
    expect<Call1<ConcatNamesNonGeneric2, Names>>().to(equal<`${string}, ...`>);

    interface Take<N extends number> extends TypeLambdaG<["T"]> {
      signature: (values: TArg<this, "T">[]) => TArg<this, "T">[];
      return: _Take<Arg0<this>, N>;
    }
    expect<Take<3>>().to(beOfSig<<T>(values: T[]) => T[]>);

    type ConcatNamesWrong = Flow<
      Filter<Flow<StringLength, NotExtend<1 | 2>>>,
      Take<3>,
      // @ts-expect-error
      Map<RepeatString<"foo">>,
      JoinBy<", ">,
      Append<", ...">
    >;

    type ConcatNamesRight = Flow<
      Filter<Flow<StringLength, NotExtend<1 | 2>>>,
      Take<3>,
      Map<CapitalizeString>,
      JoinBy<", ">,
      Append<", ...">
    >;

    expect<TypeArgs<Take<3>, [string[]]>>().to(equal<{ readonly "~T": string }>);
    expect<TypeArgs<Take<3>, { 0: number[] }>>().to(equal<{ readonly "~T": number }>);
    expect<TypeArgs<Take<3>, { r: boolean[] }>>().to(equal<{ readonly "~T": boolean }>);
    expect<TypeArgs<Take<3>, { 0: string[]; r: number[] }>>().to(
      equal<{ readonly "~T": string | number }>,
    );

    expect<TypeArgs<Take<3>, { r: string[] }>>().to(equal<{ readonly "~T": string }>);
    expect<TypeArgs<Take<3>, { 0: string[] }>>().to(equal<{ readonly "~T": string }>);
  }

  {
    interface Identity extends TypeLambdaG<["T"]> {
      signature: (value: TArg<this, "T">) => TArg<this, "T">;
      return: Arg0<this>;
    }
    type B = Sig<Identity>;
    expect<Identity>().to(beOfSig<<T>(value: T) => T>);

    interface Map extends TypeLambdaG<["T", "U"]> {
      signature: (
        f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
        xs: TArg<this, "T">[],
      ) => TArg<this, "U">[];
      return: _Map<Arg0<this>, Arg1<this>>;
    }
    type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };
    expect<Map>().to(beOfSig<<T, U>(f: (x: T) => U, xs: T[]) => U[]>);

    type HasName = { name: string };
    interface MergeUserData extends TypeLambdaG<[["T", HasName], "U"]> {
      signature: (
        user: TArg<this, "T">,
        data: TArg<this, "U">,
      ) => TArg<this, "T"> & TArg<this, "U">;
      return: Arg0<this> & Arg1<this>;
    }
    expect<MergeUserData>().to(
      beOfSig<<T extends HasName, U>(user: T & HasName, data: U) => T & HasName & U>,
    );
  }
});

test("Documentation > Type checking in detail > Bypassing strict type checking", () => {
  {
    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      return: `${Arg0<this>}${Arg1<this>}`;
    }

    expect<ApplyW<Concat, ["foo", 42]>>().to(beNever);
  }

  {
    type Stringifiable = string | number | bigint | boolean | null | undefined;

    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      return: RawArg0<this> extends infer S1 extends Stringifiable ?
        RawArg1<this> extends infer S2 extends Stringifiable ?
          `${RawArg0<this>}${RawArg1<this>}`
        : never
      : never;
    }

    expect<ApplyW<Concat, ["foo", 42]>>().to(equal<"foo42">);
  }

  {
    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      // @ts-expect-error
      return: `${RawArg0<this>}${RawArg1<this>}`;
    }
  }

  {
    interface Concat extends TypeLambda<[s1: string, s2: string], number> {
      return: `${Arg0<this>}${Arg1<this>}`;
    }

    expect<Apply<Concat, ["foo", "bar"]>>().to(beNever);
    expect<ApplyW<Concat, ["foo", "bar"]>>().to(equal<"foobar">);
  }
});

test("Documentation > Type checking in detail > Type checking in `Args`", () => {
  {
    type JoinString<S1 extends string, S2 extends string> = `${S1}${S2}`;
    type JoinStringAndNumber<S extends string, N extends number> = `${S}${N}`;

    // This is not necessary
    interface ConcatRedundant extends TypeLambda<[s1: string, s2: string], string> {
      return: Arg0<this> extends infer S1 extends string ?
        Arg1<this> extends infer S2 extends string ?
          JoinString<S1, S2>
        : never
      : never;
    }

    // This is enough
    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      return: JoinString<Arg0<this>, Arg1<this>>; // OK
    }

    // Incompatible type errors are caught by TypeScript
    interface ConcatMismatch extends TypeLambda<[s1: string, s2: string], string> {
      // @ts-expect-error
      return: JoinStringAndNumber<Arg0<this>, Arg1<this>>;
    }
  }

  {
    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      return: [Arg0<this>, Arg1<this>]; // We just print the arguments here for demonstration
    }

    expect<Call2W<Concat, "foo", 42>>().to(equal<["foo", never]>);
  }

  {
    interface PrintArgs extends TypeLambda<[a: string, b: string], string> {
      return: Args<this>;
    }

    // Incompatible arguments are cast to `never`
    expect<ApplyW<PrintArgs, ["foo", 42]>>().to(equal<["foo", never]>);
    // Redundant arguments are truncated
    expect<ApplyW<PrintArgs, ["foo", "bar", "baz"]>>().to(equal<["foo", "bar"]>);
    // Missing arguments are filled with `never`
    expect<ApplyW<PrintArgs, ["foo"]>>().to(equal<["foo", never]>);
  }
});

test("Documentation > Type checking in detail > Type checking in `Apply` and `Call*`", () => {
  {
    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      return: `${Arg0<this>}${Arg1<this>}`;
    }

    // Here we return a number, which is incompatible with the declared return type `string`
    interface ConcatWrong extends TypeLambda<[s1: string, s2: string], string> {
      return: 42;
    }

    expect<Apply<Concat, ["foo", "bar"]>>().to(equal<"foobar">);
    expect<Apply<ConcatWrong, ["foo", "bar"]>>().to(beNever);
    expect<Call2<ConcatWrong, "foo", "bar">>().to(beNever);
  }

  {
    interface JoinByRight<Sep extends string> extends TypeLambda<[strings: string[]], string> {
      return: Arg0<this> extends [infer S] ? S
      : Arg0<this> extends [infer Head extends string, ...infer Tail extends string[]] ?
        `${Head}${Sep}${Call1<JoinByRight<Sep>, Tail>}`
      : "";
    }

    interface JoinByWrong<Sep extends string> extends TypeLambda<[strings: string[]], string> {
      return: Arg0<this> extends [infer S] ? S
      : Arg0<this> extends [infer Head extends string, ...infer Tail extends string[]] ?
        // @ts-expect-error
        `${Head}${Sep}${Call1W<JoinByWrong<Sep>, Tail>}`
      : "";
    }
  }
});

test("Documentation > Type checking in detail > Type checking in _generic_ type-level functions", () => {
  {
    /* Types used in previous examples */
    interface Append<Suffix extends string> extends TypeLambda<[s: string], string> {
      return: `${Arg0<this>}${Suffix}`;
    }
    /* end */

    interface Map extends TypeLambdaG<["T", "U"]> {
      signature: (
        f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
        xs: TArg<this, "T">[],
      ) => TArg<this, "U">[];
      return: _Map<Arg0<this>, Arg1<this>>;
    }
    type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

    type MyApply<F extends TypeLambda, Args extends Params<F>> = ApplyW<F, Args>;

    // @ts-expect-error
    type MapResult = MyApply<Map, [Append<"baz">, ["foo", "bar"]]>;

    expect<Params<Map>>().to(equal<[f: TypeLambda<[x: unknown], unknown>, xs: unknown[]]>);

    expect<TolerantParams<Map>>().to(equal<[f: TypeLambda<[x: never], unknown>, xs: unknown[]]>);
    expect<TolerantRetType<Map>>().to(equal<unknown[]>);
  }

  {
    const apply = <F extends (...args: any) => unknown>(f: F, args: Parameters<F>): ReturnType<F> =>
      Function.prototype.apply(f, args);

    const map = <T, U>(f: (x: T) => U, xs: T[]): U[] => xs.map(f);

    // @ts-expect-error
    apply(map, [(s: string) => s + "baz", ["foo", "bar"]]);
  }
});

test("Documentation > Common Utilities > `Always`, `Identity` and `Ask`", () => {
  {
    type Result<T, E> = Ok<T> | Err<E>;
    type Ok<T> = { _tag: "Ok"; value: T };
    type Err<E> = { _tag: "Err"; error: E };

    interface MatchResult<OnOk extends TypeLambda1, OnErr extends TypeLambda1>
      extends TypeLambda<
        [
          result: Result<
            OnOk extends TypeLambda0 ? unknown : Param0<OnOk>,
            OnErr extends TypeLambda0 ? unknown : Param0<OnErr>
          >,
        ],
        RetType<OnOk> | RetType<OnErr>
      > {
      return: Arg0<this> extends { _tag: "Ok"; value: infer T } ? Call1<OnOk, T>
      : Arg0<this> extends { _tag: "Err"; error: infer E } ? Call1<OnErr, E>
      : never;
    }

    interface Prepend<Prefix extends string> extends TypeLambda<[s: string], string> {
      return: `${Prefix}${Arg0<this>}`;
    }

    expect<Pipe<Ok<"Bob">, MatchResult<Prepend<"Mr. ">, Always<"Oops!">>>>().to(equal<"Mr. Bob">);
    expect<Pipe<Err<"wrong">, MatchResult<Prepend<"Mr. ">, Always<"Oops!">>>>().to(equal<"Oops!">);

    expect<Pipe<Err<"wrong">, MatchResult<Prepend<"Mr. ">, Identity>>>().to(equal<"wrong">);
  }

  {
    expect<Flow<Ask<string>, Identity>>().to(beOfSig<(value: string) => string>);
    expect<Compose<Identity, Ask<number>>>().to(beOfSig<(value: number) => number>);
  }
});

test("Documentation > Common Utilities > `Tupled` and `Untupled`", () => {
  {
    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      return: `${Arg0<this>}${Arg1<this>}`;
    }
    expect<Concat>().to(beOfSig<(s1: string, s2: string) => string>);
    expect<Call2<Concat, "foo", "bar">>().to(equal<"foobar">);

    type TupledConcat = Tupled<Concat>;
    expect<TupledConcat>().to(beOfSig<(args: [s1: string, s2: string]) => string>);
    expect<Call1<TupledConcat, ["foo", "bar"]>>().to(equal<"foobar">);
  }

  {
    interface First extends TypeLambdaG<["T"]> {
      signature: (pair: [TArg<this, "T">, unknown]) => TArg<this, "T">;
      return: Arg0<this>[0];
    }
    expect<First>().to(beOfSig<<T>(pair: [T, unknown]) => T>);
    expect<Call1<First, [42, "foo"]>>().to(equal<42>);

    type UntupledFirst = Untupled<First>;
    expect<UntupledFirst>().to(beOfSig<<T>(args_0: T, args_1: unknown) => T>);
    expect<Call2<UntupledFirst, 42, "foo">>().to(equal<42>);
  }
});

test("Documentation > Common Utilities > `Flip`", () => {
  /* Types used in previous examples */
  interface Append<Suffix extends string> extends TypeLambda<[s: string], string> {
    return: `${Arg0<this>}${Suffix}`;
  }
  /* end */

  interface Map extends TypeLambdaG<["T", "U"]> {
    signature: (
      f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
      xs: TArg<this, "T">[],
    ) => TArg<this, "U">[];
    return: _Map<Arg0<this>, Arg1<this>>;
  }
  type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

  {
    expect<Map>().to(beOfSig<<T, U>(f: (x: T) => U, xs: T[]) => U[]>);
    expect<Call2<Map, Append<"baz">, ["foo", "bar"]>>().to(equal<["foobaz", "barbaz"]>);

    type FlippedMap = Flip<Map>;
    expect<FlippedMap>().to(beOfSig<<U, T>(xs: U[], f: (x: U) => T) => T[]>);
    expect<Call2<FlippedMap, ["foo", "bar"], Append<"baz">>>().to(equal<["foobaz", "barbaz"]>);
  }

  {
    type CurriedMap = Curry<Map>;
    expect<CurriedMap>().to(beOfSig<<T, U>(f: (x: T) => U) => (xs: T[]) => U[]>);
    expect<Call1<Call1<CurriedMap, Append<"baz">>, ["foo", "bar"]>>().to(
      equal<["foobaz", "barbaz"]>,
    );

    type FlippedCurriedMap = Flip<CurriedMap>;
    expect<FlippedCurriedMap>().to(beOfSig<<T, U>(xs: T[]) => (f: (x: T) => U) => U[]>);
    expect<Call1<Call1<FlippedCurriedMap, ["foo", "bar"]>, Append<"baz">>>().to(
      equal<["foobaz", "barbaz"]>,
    );
  }
});

test("Documentation > Common Utilities > `Curry`", () => {
  /* Types used in previous examples */
  interface Append<Suffix extends string> extends TypeLambda<[s: string], string> {
    return: `${Arg0<this>}${Suffix}`;
  }
  /* end */

  interface Map extends TypeLambdaG<["T", "U"]> {
    signature: (
      f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
      xs: TArg<this, "T">[],
    ) => TArg<this, "U">[];
    return: _Map<Arg0<this>, Arg1<this>>;
  }
  type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

  {
    type CurriedMap = Curry<Map>;
    expect<CurriedMap>().to(beOfSig<<T, U>(f: (x: T) => U) => (xs: T[]) => U[]>);
    expect<Call1<CurriedMap, Append<"baz">>>().to(beOfSig<(xs: string[]) => string[]>);
  }

  {
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
    expect<Call3<Reduce, Concat, "", ["foo", "bar", "baz"]>>().to(equal<"foobarbaz">);

    type CurriedReduce = Curry<Reduce>;
    expect<CurriedReduce>().to(
      beOfSig<<T, U>(f: (acc: U, x: T) => U) => (init: U) => (xs: T[]) => U>,
    );
    expect<Call1<Call1<Call1<CurriedReduce, Concat>, "">, ["foo", "bar", "baz"]>>().to(
      equal<"foobarbaz">,
    );
  }

  {
    // <T, U>[f: (x: T) => U](xs: T[]) => U[]
    type MapBy<F extends TypeLambda1> = Call1<Curry<Map>, F>;
    expect<MapBy<Append<"baz">>>().to(beOfSig<(xs: string[]) => string[]>);

    // <T, U>[xs: T[]](f: (x: T) => U) => U[]
    type MapOn1<TS extends unknown[]> = Call1<Flip<Curry<Map>>, TS>;
    expect<MapOn1<string[]>>().to(beOfSig<(f: (x: string) => unknown) => unknown[]>);

    type MapOn2<TS extends unknown[]> = Call1<Curry<Flip<Map>>, TS>;
    expect<MapOn2<string[]>>().to(beOfSig<(f: (x: string) => unknown) => unknown[]>);
  }
});
