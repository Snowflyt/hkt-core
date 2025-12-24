/*
╔═════════════════════════════════════════════════════════════════╗
║                                                                 ║
║      ."|".       _    _ _  _________                            ║
║     / \|/ \     | |  | | |/ /__   __|                           ║
║    |\  |  /|    | |__| | ' /   | |     _________  ________      ║
║    | '.|.' |    |  __  |  <    | |    / ___/ __ \/ ___/ _ \     ║
║     "._|_."     | |  | | . \   | |   / /__/ /_/ / /  /  __/     ║
║        |        |_|  |_|_|\_\  |_|   \___/\____/_/   \___/      ║
║                                                                 ║
║                                                                 ║
║    A micro Higher-Kinded Type implementation for TypeScript,    ║
║    with type safety elegantly guaranteed.                       ║
║                                                                 ║
║    Licensed under MIT                                           ║
║                                                                 ║
║    Ge Gao (Snowflyt) <gaoge011022@gmail.com>                    ║
║                                                                 ║
║    https://github.com/Snowflyt/hkt-core                         ║
║                                                                 ║
╚═════════════════════════════════════════════════════════════════╝
*/

/**********************
 * Internal utilities *
 **********************/
/**
 * Flip the variance of `T`.
 * @private
 */
interface In<in T> {
  __hkt_core_tag: "In";
  (_: T): void;
}

/**
 * Get the value type of a key in an object type.
 * @private
 *
 * @example
 * ```typescript
 * type _1 = GetProp<{ a: 1, b: 2 }, "a">; // => 1
 * type _2 = GetProp<{ a: 1, b: 2 }, "c">; // => never
 * ```
 */
type GetProp<O, K> = K extends keyof O ? O[K] : never;

/**
 * Convert a string to a number.
 * @private
 *
 * @example
 * ```typescript
 * type R = StringToNumber<"42">; // => 42
 * ```
 */
type StringToNumber<S> = S extends `${infer N extends number}` ? N : never;

/**
 * Get the numeric index type of an object or array type.
 * @private
 *
 * @example
 * ```typescript
 * type _1 = IndexOf<{ 0: string; b: number; 1: boolean }>; // => 0 | 1
 * type _2 = IndexOf<[string, number, boolean]>; // => 0 | 1 | 2
 * type _3 = IndexOf<string[]>; // => number
 * ```
 */
type IndexOf<O> =
  O extends readonly unknown[] ?
    number extends O["length"] ?
      number & keyof O
    : _IndexOfTuple<O> & keyof O
  : keyof O & number;
type _IndexOfTuple<
  O extends readonly unknown[],
  Counter extends void[] = [],
  Acc extends number = never,
> =
  Counter["length"] extends O["length"] ? Acc
  : _IndexOfTuple<O, [...Counter, void], Acc | Counter["length"]>;

/**
 * Remove the first element from a tuple type (label is preserved).
 * @private
 *
 * @example
 * ```typescript
 * type _1 = Tail<[1, 2, 3]>; // => [2, 3]
 * type _2 = Tail<[1]>; // => []
 * type _3 = Tail<[]>; // => []
 * type _4 = Tail<[a: 1, b: 2, c: 3]>; // => [b: 2, c: 3]
 * ```
 */
type Tail<TS> =
  TS extends [unknown, ...infer Tail] ? Tail
  : TS extends readonly [unknown, ...infer Tail] ? readonly [...Tail]
  : TS extends [] ? []
  : TS extends readonly [] ? readonly []
  : never;
/**
 * Get the initial elements of a tuple type (label is preserved).
 * @private
 *
 * @example
 * ```typescript
 * type _1 = Init<[1, 2, 3]>; // => [1, 2]
 * type _2 = Init<[1]>; // => []
 * type _3 = Init<[]>; // => []
 * type _4 = Init<[a: 1, b: 2, c: 3]>; // => [a: 1, b: 2]
 * ```
 */
type Init<TS> =
  TS extends [...infer Init, unknown] ? Init
  : TS extends readonly [...infer Init, unknown] ? readonly [...Init]
  : TS extends [] ? []
  : TS extends readonly [] ? readonly []
  : never;
/**
 * Get the head part of a tuple type (label is preserved).
 * @private
 *
 * @example
 * ```typescript
 * type _1 = HeadPart<[1, 2, 3]>; // => [1]
 * type _2 = HeadPart<[1]>; // => [1]
 * type _3 = HeadPart<[]>; // => []
 * type _4 = HeadPart<[a: 1, b: 2, c: 3]>; // => [a: 1]
 * ```
 */
type HeadPart<TS, Result = TS> =
  Result extends readonly [] | readonly [unknown] ? Result : HeadPart<Tail<TS>, Init<Result>>;
/**
 * Get the part of a tuple type at {@linkcode Index} (label is preserved).
 * @private
 *
 * @example
 * ```typescript
 * type _1 = GetPart<[1, 2, 3], 0>; // => [1]
 * type _2 = GetPart<[1, 2, 3], 1>; // => [2]
 * type _3 = GetPart<[1, 2, 3], 2>; // => [3]
 * type _4 = GetPart<[1, 2, 3], 3>; // => []
 * type _5 = GetPart<[a: 1, b: 2, c: 3], 1>; // => [b: 2]
 * ```
 */
type GetPart<TS, Index, Counter extends void[] = []> =
  Counter["length"] extends Index ? HeadPart<TS> : GetPart<Tail<TS>, Index, [...Counter, void]>;

/**
 * A wider version of {@linkcode Parameters} that does not require the type to be a function.
 * @private
 */
type ParametersW<F> = F extends (...args: infer Params) => unknown ? Params : never;
/**
 * A wider version of {@linkcode ReturnType} that does not require the type to be a function.
 * @private
 */
type ReturnTypeW<F> = F extends (...args: never) => infer R ? R : never;

/**
 * Check whether two types are exactly equal.
 * @private
 *
 * @see https://github.com/microsoft/TypeScript/issues/27024#issuecomment-421529650
 */
type Equals<T, U> =
  (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? true : false;

/******************************************
 * {@linkcode TypeLambda} and its aliases *
 ******************************************/
/**
 * A type used to represent a type-level function (or **HKT**, higher-kinded type, if you prefer an
 * academic term).
 *
 * See {@linkcode TypeLambdaG} if you want to create a generic TypeLambda.
 *
 * @example
 * ```typescript
 * import type { Apply, Arg0, Arg1, Sig, TypeLambda } from "hkt-core";
 *
 * // Create a TypeLambda that concatenates two strings
 * interface Concat extends TypeLambda<[s1: string, s2: string], string> {
 *   // Arguments can be accessed via `Args<this>`, `Arg0<this>`, `Arg1<this>`, etc.
 *   return: `${Arg0<this>}${Arg1<this>}`;
 * }
 * // Apply a TypeLambda with arguments
 * type ConcatRes = Apply<Concat, ["foo", "bar"]>; // => "foobar"
 * // Print the signature of `Concat` for debugging purposes
 * type ConcatSig = Sig<Concat>; // => (s1: string, s2: string) => string
 * // Errors are reported if arguments are not compatible with parameters
 * type ConcatWrong = Apply<Concat, ["foo", 42]>;
 * //                               ~~~~~~~~~~~
 * // Type '["foo", 42]' does not satisfy the constraint '[s1: string, s2: string]'.
 * //   Type at position 1 in source is not compatible with type at position 1 in target.
 * //     Type 'number' is not assignable to type 'string'.
 *
 * // Create a TypeLambda that joins an array of strings with a separator
 * interface JoinBy<Sep extends string> extends TypeLambda<[strings: string[]], string> {
 *   return: Arg0<this> extends [infer S extends string] ? S
 *   : Arg0<this> extends [infer Head extends string, ...infer Tail extends string[]] ?
 *     `${Head}${Sep}${Apply<JoinBy<Sep>, [Tail]>}`
 *   : "";
 * }
 * type JoinBySig = Sig<JoinBy<", ">>; // => (strings: string[]) => string
 * type JoinByRes = Apply<JoinBy<", ">, [["foo", "bar", "baz"]]>; // => "foo, bar, baz"
 *
 * // If you don’t want to type the TypeLambda, simply extend them without specifying the parameters
 * // and return type
 * interface JustConcat extends TypeLambda {
 *   return: `${Arg0<this>}${Arg1<this>}`;
 * }
 * type JustConcatSig = Apply<JustConcat, ["foo", "bar"]>; // => "foobar"
 * type JustConcatRes = Apply<JustConcat, ["foo", 42]>; // => "foo42"
 * ```
 */
export interface TypeLambda<in Params extends unknown[] = any, out RetType = any> {
  /**
   * Metadata of the {@linkcode TypeLambda}.
   */
  readonly ["~hkt"]: TypeLambdaMeta;

  /**
   * type-level signature of the {@linkcode TypeLambda}.
   */
  readonly signature: (...args: Params) => RetType;
}
/**
 * Metadata of a {@linkcode TypeLambda}.
 */
interface TypeLambdaMeta {
  /**
   * The version number of the {@linkcode TypeLambda} specification.
   */
  readonly version: 1;
}

/**
 * A shorthand for `TypeLambda<[], R>`.
 *
 * @see {@linkcode TypeLambda}
 */
export interface TypeLambda0<out R = any> extends TypeLambda<[], R> {}
/**
 * A shorthand for `TypeLambda<[A0], R>`.
 *
 * @see {@linkcode TypeLambda}
 */
export interface TypeLambda1<in A0 = any, out R = any> extends TypeLambda<[A0], R> {}
/**
 * An alias of {@linkcode TypeLambda1}.
 */
export type HKT<T = any, F = any> = TypeLambda1<T, F>;
/**
 * A shorthand for `TypeLambda<[A0, A1], R>`.
 *
 * @see {@linkcode TypeLambda}
 */
export interface TypeLambda2<in A0 = any, in A1 = any, out R = any>
  extends TypeLambda<[A0, A1], R> {}
/**
 * An alias of {@linkcode TypeLambda2}.
 */
export type HKT2<T = any, U = any, F = any> = TypeLambda2<T, U, F>;
/**
 * A shorthand for `TypeLambda<[A0, A1, A2], R>`.
 *
 * @see {@linkcode TypeLambda}
 */
export interface TypeLambda3<in A0 = any, in A1 = any, in A2 = any, out R = any>
  extends TypeLambda<[A0, A1, A2], R> {}
/**
 * An alias of {@linkcode TypeLambda3}.
 */
export type HKT3<T = any, U = any, V = any, F = any> = TypeLambda3<T, U, V, F>;
/**
 * A shorthand for `TypeLambda<[A0, A1, A2, A3], R>`.
 *
 * @see {@linkcode TypeLambda}
 */
export interface TypeLambda4<in A0 = any, in A1 = any, in A2 = any, in A3 = any, out R = any>
  extends TypeLambda<[A0, A1, A2, A3], R> {}
/**
 * An alias of {@linkcode TypeLambda4}.
 */
export type HKT4<T = any, U = any, V = any, W = any, F = any> = TypeLambda4<T, U, V, W, F>;

/***********************************
 * {@linkcode Args} as its aliases *
 ***********************************/
/**
 * Get the arguments passed to a {@linkcode TypeLambda}.
 *
 * NOTE: Arguments are cast to the expected parameters. That said:
 *
 * - If an argument is not compatible with the corresponding parameter, it is cast to `never`.
 * - Redundant arguments are truncated.
 * - Missing arguments are filled with `never`.
 *
 * Use {@linkcode RawArgs} if you want to get the original arguments passed to a
 * {@linkcode TypeLambda}, no matter whether they are compatible with parameters or not.
 *
 * @example
 * ```typescript
 * interface PrintArgs extends TypeLambda<[a: string, b: string], string> {
 *   return: Args<this>;
 * }
 *
 * // Incompatible arguments are cast to `never`
 * type _1 = ApplyW<PrintArgs, ["foo", 42]>; // => ["foo", never]
 * // Redundant arguments are truncated
 * type _2 = ApplyW<PrintArgs, ["foo", "bar", "baz"]>; // => ["foo", "bar"]
 * // Missing arguments are filled with `never`
 * type _3 = ApplyW<PrintArgs, ["foo"]>; // => ["foo", never]
 * ```
 */
export type Args<F extends TypeLambda<never, unknown>> =
  // A quick happy path for the most common case
  F extends { readonly Args: (_: infer Args extends TolerantParams<F>) => void } ? Args
  : F extends { readonly Args: (_: infer Args) => void } ? CastArgs<Args, TolerantParams<F>>
  : never;
/**
 * The **unsafe** version of {@linkcode Args} (i.e., no type checking with {@linkcode F}).
 */
export type ArgsW<F> = F extends TypeLambda<never, unknown> ? Args<F> : never;
/**
 * Cast the arguments to the expected parameters.
 *
 * - If an argument is not compatible with the corresponding parameter, it is cast to `never`.
 * - Redundant arguments are truncated.
 * - Missing arguments are filled with `never`.
 * @private
 *
 * @example
 * ```typescript
 * type _1 = CastArgs<["foo", 42], [string, string]>; // => ["foo", never]
 * type _2 = CastArgs<["foo", "bar"], [string]>; // => ["foo"]
 * type _3 = CastArgs<["foo"], [string, string]>; // => ["foo", never]
 * ```
 */
type CastArgs<Args, ExpectedParams extends unknown[]> =
  AlignArgs<
    {
      [K in keyof Args]: K extends keyof ExpectedParams ?
        Args[K] extends ExpectedParams[K] ?
          Args[K]
        : never
      : never;
    },
    ExpectedParams
  > extends infer CastedArgs extends ExpectedParams ?
    CastedArgs
  : never;
/**
 * Align the length of arguments with the length of parameters.
 * @private
 *
 * @example
 * ```typescript
 * // Redundant arguments are truncated
 * type _1 = AlignArgs<[1, 2, 3], [number, number]>; // => [1, 2]
 * // Missing arguments are filled with `never`
 * type _2 = AlignArgs<[1], [number, number]>; // => [1, never]
 *
 * // NOTE: Argument types are not checked here
 * type _3 = AlignArgs<[1, 2], [number, string]>; // => [1, 2], OK
 * ```
 */
type AlignArgs<Args, ExpectedParams extends unknown[], Acc extends unknown[] = []> =
  number extends ExpectedParams["length"] ? Args
  : Args extends readonly [infer Head, ...infer Tail] ?
    ExpectedParams extends readonly [unknown, ...infer ExpectedTail] ?
      AlignArgs<Tail, ExpectedTail, [...Acc, Head]>
    : Acc // Truncate redundant arguments
  : ExpectedParams extends readonly [unknown, ...infer ExpectedTail] ?
    // Fill in missing arguments with `never`
    AlignArgs<[], ExpectedTail, [...Acc, never]>
  : Acc;

/**
 * A shorthand for `Args<F>[0]`.
 *
 * @see {@linkcode Args}
 */
export type Arg0<F extends TypeLambda<never, unknown>> = Args<F>[0];
/**
 * The **unsafe** version of {@linkcode Arg0} (i.e., no type checking with {@linkcode F}).
 */
export type Arg0W<F> = ArgsW<F>[0];
/**
 * A shorthand for `Args<F>[1]`.
 *
 * @see {@linkcode Args}
 */
export type Arg1<F extends TypeLambda<never, unknown>> = Args<F>[1];
/**
 * The **unsafe** version of {@linkcode Arg1} (i.e., no type checking with {@linkcode F}).
 */
export type Arg1W<F> = ArgsW<F>[1];
/**
 * A shorthand for `Args<F>[2]`.
 *
 * @see {@linkcode Args}
 */
export type Arg2<F extends TypeLambda<never, unknown>> = Args<F>[2];
/**
 * The **unsafe** version of {@linkcode Arg2} (i.e., no type checking with {@linkcode F}).
 */
export type Arg2W<F> = ArgsW<F>[2];
/**
 * A shorthand for `Args<F>[3]`.
 *
 * @see {@linkcode Args}
 */
export type Arg3<F extends TypeLambda<never, unknown>> = Args<F>[3];
/**
 * The **unsafe** version of {@linkcode Arg3} (i.e., no type checking with {@linkcode F}).
 */
export type Arg3W<F> = ArgsW<F>[3];

/**
 * Get the original arguments passed to a {@linkcode TypeLambda}, no matter whether they are
 * compatible with parameters or not.
 *
 * @see {@linkcode Args} for a type that casts arguments to the expected parameters.
 */
export type RawArgs<F extends TypeLambda<never, unknown>> = RawArgsW<F>;
/**
 * The **unsafe** version of {@linkcode RawArgs} (i.e., no type checking with {@linkcode F}).
 */
export type RawArgsW<F> =
  F extends { readonly Args: (_: infer Args extends unknown[]) => void } ? Args : never;

/**
 * A shorthand for `RawArgs<F>[0]`.
 *
 * @see {@linkcode RawArgs}
 */
export type RawArg0<F extends TypeLambda<never, unknown>> = RawArgs<F>[0];
/**
 * The **unsafe** version of {@linkcode RawArg0} (i.e., no type checking with {@linkcode F}).
 */
export type RawArg0W<F> = RawArgsW<F>[0];
/**
 * A shorthand for `RawArgs<F>[1]`.
 *
 * @see {@linkcode RawArgs}
 */
export type RawArg1<F extends TypeLambda<never, unknown>> = RawArgs<F>[1];
/**
 * The **unsafe** version of {@linkcode RawArg1} (i.e., no type checking with {@linkcode F}).
 */
export type RawArg1W<F> = RawArgsW<F>[1];
/**
 * A shorthand for `RawArgs<F>[2]`.
 *
 * @see {@linkcode RawArgs}
 */
export type RawArg2<F extends TypeLambda<never, unknown>> = RawArgs<F>[2];
/**
 * The **unsafe** version of {@linkcode RawArg2} (i.e., no type checking with {@linkcode F}).
 */
export type RawArg2W<F> = RawArgsW<F>[2];
/**
 * A shorthand for `RawArgs<F>[3]`.
 *
 * @see {@linkcode RawArgs}
 */
export type RawArg3<F extends TypeLambda<never, unknown>> = RawArgs<F>[3];
/**
 * The **unsafe** version of {@linkcode RawArg3} (i.e., no type checking with {@linkcode F}).
 */
export type RawArg3W<F> = RawArgsW<F>[3];

/**
 * Get the length of the original arguments passed to a {@linkcode TypeLambda}.
 */
export type RawArgsLength<F extends TypeLambda<never, unknown>> = RawArgs<F>["length"];

/****************************************************************
 * Utilities for handling signatures of {@linkcode TypeLambda}s *
 ****************************************************************/
/**
 * Get the parameters of a {@linkcode TypeLambda}.
 *
 * @example
 * ```typescript
 * interface Concat extends TypeLambda<[s1: string, s2: string], string> {
 *   return: `${Arg0<this>}${Arg1<this>}`
 * }
 * type ConcatParams = Params<Concat>; // => [s1: string, s2: string]
 * ```
 */
export type Params<F extends TypeLambda<never, unknown>, Known = never> = Parameters<
  (F extends TypeLambdaG ? F & TypeArgs<F, Known> : F)["signature"]
>;
/**
 * The **unsafe** version of {@linkcode Params} (i.e., no type checking with {@linkcode F}).
 */
export type ParamsW<F, Known = never> =
  F extends TypeLambda<never, unknown> ? Params<F, Known> : never;
/**
 * A shorthand for `Params<F>[0]`.
 *
 * @see {@linkcode Params}
 */
export type Param0<F extends TypeLambda<never, unknown>, Known = never> = Params<F, Known>[0];
/**
 * The **unsafe** version of {@linkcode Param0} (i.e., no type checking with {@linkcode F}).
 */
export type Param0W<F, Known = never> = ParamsW<F, Known>[0];
/**
 * A shorthand for `Params<F>[1]`.
 *
 * @see {@linkcode Params}
 */
export type Param1<F extends TypeLambda<never, unknown>, Known = never> = Params<F, Known>[1];
/**
 * The **unsafe** version of {@linkcode Param1} (i.e., no type checking with {@linkcode F}).
 */
export type Param1W<F, Known = never> = ParamsW<F, Known>[1];
/**
 * A shorthand for `Params<F>[2]`.
 *
 * @see {@linkcode Params}
 */
export type Param2<F extends TypeLambda<never, unknown>, Known = never> = Params<F, Known>[2];
/**
 * The **unsafe** version of {@linkcode Param2} (i.e., no type checking with {@linkcode F}).
 */
export type Param2W<F, Known = never> = ParamsW<F, Known>[2];
/**
 * A shorthand for `Params<F>[3]`.
 *
 * @see {@linkcode Params}
 */
export type Param3<F extends TypeLambda<never, unknown>, Known = never> = Params<F, Known>[3];
/**
 * The **unsafe** version of {@linkcode Param3} (i.e., no type checking with {@linkcode F}).
 */
export type Param3W<F, Known = never> = ParamsW<F, Known>[3];

/**
 * Get the length of the parameters of a {@linkcode TypeLambda}.
 *
 * @example
 * ```typescript
 * interface Concat extends TypeLambda<[s1: string, s2: string], string> {
 *   return: `${Arg0<this>}${Arg1<this>}`
 * }
 * type ConcatParamsLength = ParamsLength<Concat>; // => 2
 * ```
 */
export type ParamsLength<F extends TypeLambda<never, unknown>> = Parameters<
  F["signature"]
>["length"];

/**
 * Get the return type of a {@linkcode TypeLambda}.
 *
 * @example
 * ```typescript
 * interface Concat extends TypeLambda<[s1: string, s2: string], string> {
 *   return: `${Arg0<this>}${Arg1<this>}`
 * }
 * type ConcatRetType = RetType<Concat>; // => string
 * ```
 */
export type RetType<F extends TypeLambda<never, unknown>, Known = never> = ReturnTypeW<
  (F extends TypeLambdaG ? F & TypeArgs<F, Known> : F)["signature"]
>;
/**
 * The **unsafe** version of {@linkcode RetType} (i.e., no type checking with {@linkcode F}).
 */
export type RetTypeW<F, Known = never> =
  F extends TypeLambda<never, unknown> ? RetType<F, Known> : never;

/**
 * Get the signature of a {@linkcode TypeLambda}.
 *
 * **⚠️ Warning:** This utility is intended _exclusively_ for debugging purposes. Due to its
 * complexity and focus on providing human-readable type information, it is not guaranteed to be
 * forward-compatible with future versions of this library. Use with caution!
 *
 * @example
 * ```typescript
 * interface Concat extends TypeLambda<[s1: string, s2: string], string> {
 *   return: `${Arg0<this>}${Arg1<this>}`
 * }
 * type ConcatSig = Sig<Concat>; // => (s1: string, s2: string) => string
 *
 * interface MakeTuple extends TypeLambdaG<["T"]> {
 *   signature: (value: TArg<this, "T">) => [TArg<this, "T">];
 *   return: [Arg0<this>];
 * }
 * type MakeTupleSig = Sig<MakeTuple>; // => <T>(value: T) => [T]
 *
 * interface Map extends TypeLambdaG<["T", "U"]> {
 *   signature: (f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>, xs: TArg<this, "T">[]) => TArg<this, "U">[];
 *   return: _Map<Arg0<this>, Arg1<this>>;
 * }
 * type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };
 * type MapSig = Sig<Map>; // => <T, U>(f: (x: T) => U, xs: T[]) => U[]
 * ```
 */
export type Sig<F, Known = never> =
  F extends TypeLambda<never, unknown> ? _Sig<F, Params<F>, RetType<F>, Known> : F;
type _Sig<F, BaseParams extends unknown[], BaseRetType, Known = never> =
  F extends TypeLambdaG ?
    [Known] extends [never] ?
      // Format with generic function type if `F` is a generic TypeLambda and `Known` is `never`
      F["~hkt"]["tparams"] extends infer TypeParameters extends TypeParameter[] ?
        // * TypeLambda1
        TypeParameters["length"] extends 1 ?
          [unknown] extends [TypeParameters[0][1]] ?
            // Hide `T extends unknown`
            <T>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T]>, BaseRetType>
          : <T extends TypeParameters[0][1]>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T]>, BaseRetType>
        : // * TypeLambda2
        TypeParameters["length"] extends 2 ?
          [unknown, unknown] extends [TypeParameters[0][1], TypeParameters[1][1]] ?
            <T, U>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U]>, BaseRetType>
          : [unknown] extends [TypeParameters[0][1]] ?
            <T, U extends TypeParameters[1][1]>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U]>, BaseRetType>
          : [unknown] extends [TypeParameters[1][1]] ?
            <T extends TypeParameters[0][1], U>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U]>, BaseRetType>
          : <T extends TypeParameters[0][1], U extends TypeParameters[1][1]>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U]>, BaseRetType>
        : // * TypeLambda3
        TypeParameters["length"] extends 3 ?
          [unknown, unknown, unknown] extends (
            [TypeParameters[0][1], TypeParameters[1][1], TypeParameters[2][1]]
          ) ?
            <T, U, V>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U, V]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V]>, BaseRetType>
          : [unknown, unknown] extends [TypeParameters[0][1], TypeParameters[1][1]] ?
            <T, U, V extends TypeParameters[2][1]>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U, V]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V]>, BaseRetType>
          : [unknown, unknown] extends [TypeParameters[0][1], TypeParameters[2][1]] ?
            <T, U extends TypeParameters[1][1], V>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U, V]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V]>, BaseRetType>
          : [unknown, unknown] extends [TypeParameters[1][1], TypeParameters[2][1]] ?
            <T extends TypeParameters[0][1], U, V>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U, V]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V]>, BaseRetType>
          : [unknown] extends [TypeParameters[0][1]] ?
            <T, U extends TypeParameters[1][1], V extends TypeParameters[2][1]>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U, V]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V]>, BaseRetType>
          : [unknown] extends [TypeParameters[1][1]] ?
            <T extends TypeParameters[0][1], U, V extends TypeParameters[2][1]>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U, V]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V]>, BaseRetType>
          : [unknown] extends [TypeParameters[2][1]] ?
            <T extends TypeParameters[0][1], U extends TypeParameters[1][1], V>(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U, V]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V]>, BaseRetType>
          : <
              T extends TypeParameters[0][1],
              U extends TypeParameters[1][1],
              V extends TypeParameters[2][1],
            >(
              ...args: _FurtherExpandAll<_GenericParamsWithTypeArgsTuple<F, [T, U, V]>, BaseParams>
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V]>, BaseRetType>
        : // * TypeLambda4
        TypeParameters["length"] extends 4 ?
          [unknown, unknown, unknown, unknown] extends (
            [TypeParameters[0][1], TypeParameters[1][1], TypeParameters[2][1], TypeParameters[3][1]]
          ) ?
            <T, U, V, W>(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
          : [unknown, unknown, unknown] extends (
            [TypeParameters[0][1], TypeParameters[1][1], TypeParameters[2][1]]
          ) ?
            <T, U, V, W extends TypeParameters[3][1]>(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
          : [unknown, unknown, unknown] extends (
            [TypeParameters[0][1], TypeParameters[1][1], TypeParameters[3][1]]
          ) ?
            <T, U, V extends TypeParameters[2][1], W>(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
          : [unknown, unknown, unknown] extends (
            [TypeParameters[0][1], TypeParameters[2][1], TypeParameters[3][1]]
          ) ?
            <T, U extends TypeParameters[1][1], V, W>(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
          : [unknown, unknown, unknown] extends (
            [TypeParameters[1][1], TypeParameters[2][1], TypeParameters[3][1]]
          ) ?
            <T extends TypeParameters[0][1], U, V, W>(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
          : [unknown, unknown] extends [TypeParameters[0][1], TypeParameters[1][1]] ?
            <T, U, V extends TypeParameters[2][1], W extends TypeParameters[3][1]>(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
          : [unknown, unknown] extends [TypeParameters[0][1], TypeParameters[2][1]] ?
            <T, U extends TypeParameters[1][1], V, W extends TypeParameters[3][1]>(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
          : [unknown, unknown] extends [TypeParameters[0][1], TypeParameters[3][1]] ?
            <T, U extends TypeParameters[1][1], V extends TypeParameters[2][1], W>(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
          : [unknown, unknown] extends [TypeParameters[1][1], TypeParameters[2][1]] ?
            <T extends TypeParameters[0][1], U, V, W extends TypeParameters[3][1]>(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
          : [unknown, unknown] extends [TypeParameters[1][1], TypeParameters[3][1]] ?
            <T extends TypeParameters[0][1], U, V extends TypeParameters[2][1], W>(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
          : [unknown, unknown] extends [TypeParameters[2][1], TypeParameters[3][1]] ?
            <T extends TypeParameters[0][1], U extends TypeParameters[1][1], V, W>(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
          : <
              T extends TypeParameters[0][1],
              U extends TypeParameters[1][1],
              V extends TypeParameters[2][1],
              W extends TypeParameters[3][1],
            >(
              ...args: _FurtherExpandAll<
                _GenericParamsWithTypeArgsTuple<F, [T, U, V, W]>,
                BaseParams
              >
            ) => _FurtherExpand<_GenericRetTypeWithTypeArgsTuple<F, [T, U, V, W]>, BaseRetType>
        : // Fallback to simple formatter, since we cannot handle these all conditions infinitely
          (
            ...args: _FurtherExpandAll<Params<F>, BaseParams>
          ) => _FurtherExpand<RetType<F>, BaseRetType>
      : never
    : // Fallback to simple formatter if `Known` is not `never`
      (
        ...args: _FurtherExpandAll<Params<F, Known>, BaseParams>
      ) => _FurtherExpand<RetType<F, Known>, BaseRetType>
  : F extends TypeLambda<never, unknown> ?
    (
      ...args: _FurtherExpandAll<TolerantParams<F>, BaseParams>
    ) => _FurtherExpand<TolerantRetType<F>, BaseRetType>
  : never;
type _FurtherExpandAll<TS extends unknown[], BaseTypes extends unknown[]> = {
  [K in keyof BaseTypes]: _FurtherExpand<TS[StringToNumber<K>], BaseTypes[K]>;
};
type _FurtherExpand<T, BaseType> =
  BaseType extends TypeLambda<never, unknown> ?
    _Sig<T, TolerantParams<BaseType>, TolerantRetType<BaseType>>
  : T;
type _GenericParamsWithTypeArgsTuple<F extends TypeLambdaG, Types extends unknown[]> = Parameters<
  _RefinedSigByTypeArgsTuple<F, Types>
>;
type _GenericRetTypeWithTypeArgsTuple<F extends TypeLambdaG, Types extends unknown[]> = ReturnTypeW<
  _RefinedSigByTypeArgsTuple<F, Types>
>;
type _RefinedSigByTypeArgsTuple<F extends TypeLambdaG, Types extends unknown[]> = (F & {
  readonly [K in IndexOf<F["~hkt"]["tparams"]> as `~${F["~hkt"]["tparams"][K][0]}`]: Types[K];
})["signature"];

/***********
 * Generic *
 ***********/
/**
 * The identifier use internally for a type parameter.
 * @private
 */
type TypeParameterIdentifier = Capitalize<string>;
/**
 * A type parameter identifier with an upper bound.
 * @private
 */
type TypeParameter = [TypeParameterIdentifier, unknown];

/**
 * A generic {@linkcode TypeLambda}.
 *
 * @example
 * ```typescript
 * interface MakeTuple extends TypeLambdaG<["T"]> {
 *   signature: (value: TArg<this, "T">) => [TArg<this, "T">];
 *   return: [Arg0<this>];
 * }
 *
 * type MakeTupleSig = Sig<MakeTuple>; // => <T>(value: T) => [T]
 * type _1 = Apply<MakeTuple, [42]>; // => [42]
 *
 * type WrapStringTuple = Flow<Ask<string>, MakeTuple>;
 * type WrapStringTupleSig = Sig<WrapStringTuple>; // => (value: string) => [string]
 * type _2 = Apply<WrapStringTuple, ["foo"]>; // => ["foo"]
 * ```
 *
 * @see {@linkcode TArg}
 */
export type TypeLambdaG<
  TypeParameters extends (TypeParameterIdentifier | TypeParameter)[] = never,
> =
  [TypeParameters] extends [never] ?
    // If `TypeParameters` defaults to `never`, `TypeLambdaG` is likely to be used as a placeholder,
    // e.g., `type ProcessSomething<F extends TypeLambdaG> = ...`
    GenericTypeLambda<TypeParameter[]>
  : // If `TypeParameters` is not `never`, `TypeLambdaG` it used to create a concrete generic
    // TypeLambda
    GenericTypeLambda<{
      // Normalize `TypeParameters` to `TypeParameterIdentifierWithUpperBound[]`
      [K in keyof TypeParameters]: TypeParameters[K] extends TypeParameter ?
        [TypeParameters[K][0], TypeParameters[K][1]]
      : TypeParameters[K] extends TypeParameterIdentifier ?
        // Upper bound defaults to `unknown`
        [TypeParameters[K], unknown]
      : never;
    }>;
interface GenericTypeLambda<TypeParameters extends TypeParameter[]>
  extends TypeLambda<never, unknown> {
  readonly ["~hkt"]: GenericTypeLambdaMeta<TypeParameters>;
}
interface GenericTypeLambdaMeta<TypeParameters extends TypeParameter[]> extends TypeLambdaMeta {
  /**
   * Type-level type parameters of the generic type lambda ({@linkcode TypeLambdaG}).
   */
  readonly tparams: TypeParameters;
}

/**
 * Get a generic type parameter of a {@linkcode TypeLambdaG} by name.
 */
export type TArg<F extends TypeLambdaG, Name extends F["~hkt"]["tparams"][number][0]> =
  // Do not use the following implementation
  // ```
  // F extends {
  //   readonly [K in `~${Name}`]: infer T extends _TypeParameterUpperBoundByName<F, Name>;
  // } ? T : _TypeParameterUpperBoundByName<F, Name>
  // ```
  // which does not seem to infer a type argument when its corresponding upper bound is specified
  F extends { readonly [K in `~${Name}`]: _TypeParameterUpperBoundByName<F, Name> } ? F[`~${Name}`]
  : _TypeParameterUpperBoundByName<F, Name>;
type _TypeParameterUpperBoundByName<F extends TypeLambdaG, Name extends string> = Extract<
  F["~hkt"]["tparams"][number],
  [Name, unknown]
>[1];

/**
 * Get type arguments of a {@linkcode TypeLambdaG} based on known parameters and return type.
 *
 * {@linkcode Known} is an object with integer keys and a special key `"r"` (tuples are also
 * supported since they satisfy this condition), where the integer keys represent known parameter
 * types at specific indexes, and `"r"` represents the known return type.
 *
 * `Known` is also supported by {@linkcode Sig}, {@linkcode Params}, {@linkcode RetType},
 * {@linkcode TolerantParams}, and {@linkcode TolerantRetType}.
 *
 * NOTE: This utility only infers type arguments that are “inferrable” from the known parameters
 * and return type. If a type argument cannot be inferred due to type parameter variance or lack of
 * information, it will not be included in the resulting type.
 *
 * @example
 * ```typescript
 * interface Map extends TypeLambdaG<["T", "U"]> {
 *   signature: (
 *     f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
 *     xs: TArg<this, "T">[],
 *   ) => TArg<this, "U">[];
 *   return: _Map<Arg0<this>, Arg1<this>>;
 * }
 * type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };
 *
 * type InferredTypeArgs1 = TypeArgs<Map, { 1: string[], r: number }>;
 * // => { readonly "~T": string; readonly "~U": number; }
 * // `[TypeLambda1<number, boolean>]` is the same as `{ 0: TypeLambda1<number, boolean> }`
 * type InferredTypeArgs2 = TypeArgs<Map, [TypeLambda1<number, boolean>]>;
 * // => { readonly "~T": number; readonly "~U": boolean; }
 * type InferredTypeArgs3 = TypeArgs<Map, { 1: string[] }>;
 * // => { readonly "~T": string; }
 * ```
 */
export type TypeArgs<F extends TypeLambdaG, Known = never> =
  [Known] extends [never] ?
    // A quick path if no parameters or return type is known
    {}
  : _TypeArgs<F, _OmitInvalidKeysInKnown<F, Known>>;
type _PickTypeArgs<F> = Pick<F, `~${TypeParameterIdentifier}` & keyof F>;
// Omit extract keys and keys that are not the subtype of declared parameters or return type
type _OmitInvalidKeysInKnown<F extends TypeLambdaG, Known> = {
  [K in Extract<
    IndexOf<Known> | Extract<keyof Known, "r">,
    IndexOf<Parameters<F["signature"]>> | "r"
  > as Known[K] extends (K extends number ? TolerantParams<F>[K] : TolerantRetType<F>) ? K
  : never]: Known[K];
};
type _TypeArgs<F extends TypeLambdaG, Known> =
  F["~hkt"]["tparams"]["length"] extends 4 ?
    _BuildKnownSignature<ParametersW<F["signature"]>["length"], Known> extends (
      (_FlipParameterVariance<F, Known> & {
        readonly [K in `~${F["~hkt"]["tparams"][0][0]}`]: infer T;
      } & {
        readonly [K in `~${F["~hkt"]["tparams"][1][0]}`]: infer U;
      } & {
        readonly [K in `~${F["~hkt"]["tparams"][2][0]}`]: infer V;
      } & {
        readonly [K in `~${F["~hkt"]["tparams"][3][0]}`]: infer W;
      })["signature"]
    ) ?
      {
        readonly [K in `~${F["~hkt"]["tparams"][number][0]}` as K extends (
          `~${F["~hkt"]["tparams"][0][0]}`
        ) ?
          _TestTypeParametersVarianceAtIndex<
            F,
            [F["~hkt"]["tparams"][0]],
            IndexOf<Known> | ("r" extends keyof Known ? "r" : never)
          > extends { readonly [P in K]: "irrelevant" } ?
            never
          : K
        : K extends `~${F["~hkt"]["tparams"][1][0]}` ?
          _TestTypeParametersVarianceAtIndex<
            F,
            [F["~hkt"]["tparams"][1]],
            IndexOf<Known> | ("r" extends keyof Known ? "r" : never)
          > extends { readonly [P in K]: "irrelevant" } ?
            never
          : K
        : K extends `~${F["~hkt"]["tparams"][2][0]}` ?
          _TestTypeParametersVarianceAtIndex<
            F,
            [F["~hkt"]["tparams"][2]],
            IndexOf<Known> | ("r" extends keyof Known ? "r" : never)
          > extends { readonly [P in K]: "irrelevant" } ?
            never
          : K
        : K extends `~${F["~hkt"]["tparams"][3][0]}` ?
          _TestTypeParametersVarianceAtIndex<
            F,
            [F["~hkt"]["tparams"][3]],
            IndexOf<Known> | ("r" extends keyof Known ? "r" : never)
          > extends { readonly [P in K]: "irrelevant" } ?
            never
          : K
        : never]: K extends `~${F["~hkt"]["tparams"][0][0]}` ? T & F["~hkt"]["tparams"][0][1]
        : K extends `~${F["~hkt"]["tparams"][1][0]}` ? U & F["~hkt"]["tparams"][1][1]
        : K extends `~${F["~hkt"]["tparams"][2][0]}` ? V & F["~hkt"]["tparams"][2][1]
        : K extends `~${F["~hkt"]["tparams"][3][0]}` ? W & F["~hkt"]["tparams"][3][1]
        : never;
      }
    : never
  : F["~hkt"]["tparams"]["length"] extends 3 ?
    _BuildKnownSignature<ParametersW<F["signature"]>["length"], Known> extends (
      (_FlipParameterVariance<F, Known> & {
        readonly [K in `~${F["~hkt"]["tparams"][0][0]}`]: infer T;
      } & {
        readonly [K in `~${F["~hkt"]["tparams"][1][0]}`]: infer U;
      } & {
        readonly [K in `~${F["~hkt"]["tparams"][2][0]}`]: infer V;
      })["signature"]
    ) ?
      {
        readonly [K in `~${F["~hkt"]["tparams"][number][0]}` as K extends (
          `~${F["~hkt"]["tparams"][0][0]}`
        ) ?
          _TestTypeParametersVarianceAtIndex<
            F,
            [F["~hkt"]["tparams"][0]],
            IndexOf<Known> | ("r" extends keyof Known ? "r" : never)
          > extends { readonly [P in K]: "irrelevant" } ?
            never
          : K
        : K extends `~${F["~hkt"]["tparams"][1][0]}` ?
          _TestTypeParametersVarianceAtIndex<
            F,
            [F["~hkt"]["tparams"][1]],
            IndexOf<Known> | ("r" extends keyof Known ? "r" : never)
          > extends { readonly [P in K]: "irrelevant" } ?
            never
          : K
        : K extends `~${F["~hkt"]["tparams"][2][0]}` ?
          _TestTypeParametersVarianceAtIndex<
            F,
            [F["~hkt"]["tparams"][2]],
            IndexOf<Known> | ("r" extends keyof Known ? "r" : never)
          > extends { readonly [P in K]: "irrelevant" } ?
            never
          : K
        : never]: K extends `~${F["~hkt"]["tparams"][0][0]}` ? T & F["~hkt"]["tparams"][0][1]
        : K extends `~${F["~hkt"]["tparams"][1][0]}` ? U & F["~hkt"]["tparams"][1][1]
        : K extends `~${F["~hkt"]["tparams"][2][0]}` ? V & F["~hkt"]["tparams"][2][1]
        : never;
      }
    : never
  : F["~hkt"]["tparams"]["length"] extends 2 ?
    _BuildKnownSignature<ParametersW<F["signature"]>["length"], Known> extends (
      (_FlipParameterVariance<F, Known> & {
        readonly [K in `~${F["~hkt"]["tparams"][0][0]}`]: infer T;
      } & {
        readonly [K in `~${F["~hkt"]["tparams"][1][0]}`]: infer U;
      })["signature"]
    ) ?
      {
        readonly [K in `~${F["~hkt"]["tparams"][number][0]}` as K extends (
          `~${F["~hkt"]["tparams"][0][0]}`
        ) ?
          _TestTypeParametersVarianceAtIndex<
            F,
            [F["~hkt"]["tparams"][0]],
            IndexOf<Known> | ("r" extends keyof Known ? "r" : never)
          > extends { readonly [P in K]: "irrelevant" } ?
            never
          : K
        : K extends `~${F["~hkt"]["tparams"][1][0]}` ?
          _TestTypeParametersVarianceAtIndex<
            F,
            [F["~hkt"]["tparams"][1]],
            IndexOf<Known> | ("r" extends keyof Known ? "r" : never)
          > extends { readonly [P in K]: "irrelevant" } ?
            never
          : K
        : never]: K extends `~${F["~hkt"]["tparams"][0][0]}` ? T & F["~hkt"]["tparams"][0][1]
        : K extends `~${F["~hkt"]["tparams"][1][0]}` ? U & F["~hkt"]["tparams"][1][1]
        : never;
      }
    : never
  : F["~hkt"]["tparams"]["length"] extends 1 ?
    _BuildKnownSignature<ParametersW<F["signature"]>["length"], Known> extends (
      (_FlipParameterVariance<F, Known> & {
        readonly [K in `~${F["~hkt"]["tparams"][0][0]}`]: infer T;
      })["signature"]
    ) ?
      _TestTypeParametersVarianceAtIndex<
        F,
        F["~hkt"]["tparams"],
        IndexOf<Known> | ("r" extends keyof Known ? "r" : never)
      > extends { readonly [P in `~${F["~hkt"]["tparams"][0][0]}`]: "irrelevant" } ?
        {}
      : {
          readonly [K in `~${F["~hkt"]["tparams"][0][0]}`]: T & F["~hkt"]["tparams"][0][1];
        }
    : never
  : [];
// Fill signature with `Known` parameters and rest with placeholders (`any` for parameters and
// `never` for return type)
// NOTE: The use of `any` as placeholder for unknown parameters and `never` for unknown return type
// here is intentional and don’t change them to `unknown` or any other types unless you know what
// you are doing. I have tested with several candidates as placeholder types and found that only
// these two types can make it work.
type _BuildKnownSignature<ParameterLength extends number, Known> = (
  ...args: _BuildKnownParameters<ParameterLength, Known>
) => _BuildKnownReturnType<Known>;
type _BuildKnownParameters<ParameterLength extends number, Known, Acc extends unknown[] = []> =
  Acc["length"] extends ParameterLength ? Acc
  : Acc["length"] extends IndexOf<Known> ?
    // The reason for wrapping `In<...>` here can be found in the comment of `_WrapInForEachParam`
    _BuildKnownParameters<ParameterLength, Known, [...Acc, In<Known[Acc["length"]]>]>
  : // Use `any` as placeholder for unknown parameters
    _BuildKnownParameters<ParameterLength, Known, [...Acc, any]>;
type _BuildKnownReturnType<Known> =
  // Use `never` as placeholder for unknown return type
  "r" extends keyof Known ? Known["r"] : never;
// NOTE: Wrap `In<...>` here is intentional to flip variance of parameters,
// so TypeScript and infer type arguments correctly when known parameters are subtype of
// declared parameters.
interface _FlipParameterVariance<F extends TypeLambdaG, Known> extends TypeLambda {
  readonly "~hkt": F["~hkt"];
  readonly signature: _WrapInForEachParameter<(F & _PickTypeArgs<this>)["signature"], Known>;
}
type _WrapInForEachParameter<S extends (...args: never) => unknown, Known> =
  "r" extends keyof Known ?
    (
      ...args: Parameters<S> extends infer Params extends unknown[] ?
        { [K in keyof Params]: StringToNumber<K> extends IndexOf<Known> ? In<Params[K]> : never }
      : never
    ) => ReturnTypeW<S>
  : (
      ...args: Parameters<S> extends infer Params extends unknown[] ?
        { [K in keyof Params]: StringToNumber<K> extends IndexOf<Known> ? In<Params[K]> : never }
      : never
    ) => unknown;

/**
 * Get a **tolerant** parameter list for a {@linkcode TypeLambda}.
 *
 * If type parameters exist in the signature of {@linkcode F} (i.e., it is a
 * {@linkcode TypeLambdaG}, otherwise it falls back to {@linkcode Params}), the type parameters will
 * be replaced with the following types based on their variance:
 *
 * - **Covariant** type parameters are replaced with their upper bound (`unknown` if no upper bound).
 * - **Contravariant** type parameters are replaced with `never`.
 * - **Invariant** type parameters are replaced with `any`.
 *
 * Variance is inferred based on the usage of the type parameters in the signature of {@linkcode F}.
 * Dummy types are created to test the variance of each type parameter. The implementation refers to
 * the description of variance inference in [the Python typing documentation](https://typing.readthedocs.io/en/latest/spec/generics.html#variance-inference).
 *
 * @example
 * ```typescript
 * interface Map extends TypeLambdaG<["T", "U"]> {
 *   signature: (f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>, xs: TArg<this, "T">[]) => TArg<this, "U">[];
 *   return: _Map<Arg0<this>, Arg1<this>>;
 * }
 * type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };
 *
 * type TolerantMapParams = TolerantParams<Map>; // => [f: TypeLambda<[x: never], unknown>, xs: unknown[]]
 * ```
 */
export type TolerantParams<F extends TypeLambda<never, unknown>> =
  F extends TypeLambdaG ?
    ParametersW<F["signature"]> extends infer Params extends unknown[] ?
      {
        [I in keyof Params]: GetProp<
          ParametersW<
            (F &
              _GetTypeParametersBase<
                F["~hkt"]["tparams"],
                _TestTypeParametersVarianceAtIndex<F, F["~hkt"]["tparams"], StringToNumber<I>>
              >)["signature"]
          >,
          StringToNumber<I>
        >;
      }
    : never
  : Params<F>;
/**
 * The **unsafe** version of {@linkcode TolerantParams} (i.e., no type checking with {@linkcode F}).
 */
export type TolerantParamsW<F> = F extends TypeLambda<never, unknown> ? TolerantParams<F> : never;
/**
 * Get a tolerant return type for a {@linkcode TypeLambda}.
 *
 *  If type parameters exist in the signature of {@linkcode F} (i.e., it is a
 * {@linkcode TypeLambdaG}, otherwise it falls back to {@linkcode RetType}), the type parameters
 * will be replaced with the following types based on their variance:
 *
 * - **Covariant** type parameters are replaced with their upper bound (`unknown` if no upper bound).
 * - **Contravariant** type parameters are replaced with `never`.
 * - **Invariant** type parameters are replaced with `any`.
 *
 * Variance is inferred based on the usage of the type parameters in the signature of {@linkcode F}.
 * Dummy types are created to test the variance of each type parameter. The implementation refers to
 * the description of variance inference in [the Python typing documentation](https://typing.readthedocs.io/en/latest/spec/generics.html#variance-inference).
 *
 * @example
 * ```typescript
 * interface Map extends TypeLambdaG<["T", "U"]> {
 *   signature: (f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>, xs: TArg<this, "T">[]) => TArg<this, "U">[];
 *   return: _Map<Arg0<this>, Arg1<this>>;
 * }
 * type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };
 *
 * type CurriedMap = Curry<Map>;
 * type CurriedMapSig = Sig<CurriedMap>; // => <T, U>(f: (x: T) => U) => (xs: T[]) => U[]
 *
 * type TolerantCurriedMapRetType = TolerantRetType<CurriedMap>;
 * // => TypeLambda<[xs: never[]], unknown[]>
 * ```
 */
export type TolerantRetType<F extends TypeLambda<never, unknown>> =
  F extends TypeLambdaG ?
    ReturnTypeW<
      (F &
        _GetTypeParametersBase<
          F["~hkt"]["tparams"],
          _TestTypeParametersVarianceAtIndex<F, F["~hkt"]["tparams"], "r">
        >)["signature"]
    >
  : RetType<F>;
/**
 * The **unsafe** version of {@linkcode TolerantRetType} (i.e., no type checking with {@linkcode F}).
 */
export type TolerantRetTypeW<F> = F extends TypeLambda<never, unknown> ? TolerantRetType<F> : never;
type _GetTypeParametersBase<TypeParameters extends TypeParameter[], Variances> =
  _BuildBaseTypeArgs<TypeParameters> extends infer Base ?
    { [K in keyof Base]: _TolerantTypeArg<GetProp<Variances, K>, Base[K]> }
  : never;
type _BuildBaseTypeArgs<TypeParameters extends TypeParameter[]> = {
  [K in IndexOf<TypeParameters> as `~${TypeParameters[K][0]}`]: TypeParameters[K][1];
};
// For contravariant type arguments, use `never` as base type
// For invariant type arguments, use `any` as base type
// otherwise use its upper bound
type _TolerantTypeArg<Variance, UpperBound> =
  Variance extends "contravariant" ? never
  : Variance extends "invariant" ? any
  : UpperBound;
// Infer the variance of each type parameter for a specific parameter or return type
// The implementation refers to the description of variance inference in the Python typing
// documentation: https://typing.readthedocs.io/en/latest/spec/generics.html#variance-inference
type _TestTypeParametersVarianceAtIndex<
  F extends { readonly signature: unknown },
  TypeParameters extends TypeParameter[],
  Index extends number | "r",
> =
  Index extends unknown ?
    _BuildBaseTypeArgs<TypeParameters> extends infer Base ?
      {
        [K in keyof Base]: _CheckVariance<
          _GetParameterOrReturnTypeByIndex<
            (F & { [P in keyof Base]: P extends K ? never : any })["signature"],
            Index
          >,
          _GetParameterOrReturnTypeByIndex<
            (F & { [P in keyof Base]: P extends K ? Base[P] : any })["signature"],
            Index
          >
        >;
      }
    : never
  : never;
type _CheckVariance<Lower, Upper> =
  [Lower] extends [Upper] ?
    Equals<Lower, Upper> extends true ?
      "irrelevant"
    : "covariant"
  : [Upper] extends [Lower] ? "contravariant"
  : "invariant";
type _GetParameterOrReturnTypeByIndex<S, Index extends number | "r"> =
  Index extends number ? ParametersW<S>[Index] : ReturnTypeW<S>;

/**************************************************
 * Utilities for invoking {@linkcode TypeLambda}s *
 **************************************************/
/**
 * Apply a {@linkcode TypeLambda} with the given argument list.
 *
 * Type safety is **guaranteed**.
 *
 * @example
 * ```typescript
 * interface ParseNumber extends TypeLambda<[n: string], number> {
 *   return: Arg0<this> extends `${infer N extends number}` ? N : never;
 * }
 * type ParserNumberRes = Apply<ParseNumber, ["42"]>; // => 42
 *
 * interface Concat extends TypeLambda<[s1: string, s2: string], string> {
 *   return: `${Arg0<this>}${Arg1<this>}`
 * }
 * type ConcatRes = Apply<Concat, ["foo", "bar"]>; // => "foobar"
 * ```
 */
export type Apply<F extends TypeLambda<never, unknown>, Args extends TolerantParams<F>> =
  F & { readonly Args: (_: Args) => void } extends infer F2 extends { readonly return: unknown } ?
    F2["return"] extends infer R extends RetType<F, Args> ?
      R
    : never
  : never;
/**
 * The **unsafe** version of {@linkcode Apply} (i.e., no type checking with {@linkcode F},
 * {@linkcode Args} and return type).
 */
export type ApplyW<F, Args> =
  F & { readonly Args: (_: Args) => void } extends infer F extends { readonly return: unknown } ?
    F["return"]
  : never;

/**
 * A shorthand for `Apply<F, []>`.
 *
 * @see {@linkcode Apply}
 */
export type Call0<F extends TypeLambda0<unknown>> =
  F extends infer F2 extends { readonly return: unknown } ?
    F2["return"] extends infer R extends RetType<F> ?
      R
    : never
  : never;
/**
 * The **unsafe** version of {@linkcode Call0} (i.e., no type checking with {@linkcode F} and
 * return type).
 */
export type Call0W<F> =
  F extends infer F extends { readonly return: unknown } ? F["return"] : never;
/**
 * A shorthand for `Apply<F, [A0]>`.
 *
 * @see {@linkcode Apply}
 */
export type Call1<F extends TypeLambda1<never, unknown>, A0 extends TolerantParams<F>[0]> =
  F & { readonly Args: (_: [A0]) => void } extends infer F2 extends { readonly return: unknown } ?
    F2["return"] extends infer R extends RetType<F, [A0]> ?
      R
    : never
  : never;
/**
 * The **unsafe** version of {@linkcode Call1} (i.e., no type checking with {@linkcode F},
 * {@linkcode A0} and return type).
 */
export type Call1W<F, A0> =
  F & { readonly Args: (_: [A0]) => void } extends infer F extends { readonly return: unknown } ?
    F["return"]
  : never;
/**
 * The same as {@linkcode Call1W}, but when {@linkcode F} is not a “concrete” type lambda,
 * {@linkcode TolerantRetTypeW} is used to provide a default result instead of `never`.
 *
 * This can be useful for classical HKTs, e.g., a [Free monad](https://hackage.haskell.org/package/free)
 * defined as `type Free<F extends HKT, A> = { _tag: "Pure"; _0: A } | { _tag: "Suspend"; _0: Kind<F, Free<F, A>> }`.
 */
export type Kind<F, T> =
  F & { readonly Args: (_: [T]) => void } extends infer F extends { readonly return: unknown } ?
    F["return"]
  : TolerantRetTypeW<F>;
/**
 * A shorthand for `Apply<F, [A0, A1]>`.
 *
 * @see {@linkcode Apply}
 */
export type Call2<
  F extends TypeLambda2<never, never, unknown>,
  A0 extends TolerantParams<F>[0],
  A1 extends TolerantParams<F>[1],
> =
  F & { readonly Args: (_: [A0, A1]) => void } extends (
    infer F2 extends { readonly return: unknown }
  ) ?
    F2["return"] extends infer R extends RetType<F, [A0, A1]> ?
      R
    : never
  : never;
/**
 * The **unsafe** version of {@linkcode Call2} (i.e., no type checking with {@linkcode F},
 * {@linkcode A0}, {@linkcode A1} and return type).
 */
export type Call2W<F, A0, A1> =
  F & { readonly Args: (_: [A0, A1]) => void } extends (
    infer F extends { readonly return: unknown }
  ) ?
    F["return"]
  : never;
/**
 * The same as {@linkcode Call2W}, but when {@linkcode F} is not a “concrete” type lambda,
 * {@linkcode TolerantRetTypeW} is used to provide a default result instead of `never`.
 *
 * This can be useful for classical HKTs, see {@linkcode Kind}.
 */
export type Kind2<F, T, U> =
  F & { readonly Args: (_: [T, U]) => void } extends infer F extends { readonly return: unknown } ?
    F["return"]
  : TolerantRetTypeW<F>;
/**
 * A shorthand for `Apply<F, [A0, A1, A2]>`.
 *
 * @see {@linkcode Apply}
 */
export type Call3<
  F extends TypeLambda3<never, never, never, unknown>,
  A0 extends TolerantParams<F>[0],
  A1 extends TolerantParams<F>[1],
  A2 extends TolerantParams<F>[2],
> =
  F & { readonly Args: (_: [A0, A1, A2]) => void } extends (
    infer F2 extends { readonly return: unknown }
  ) ?
    F2["return"] extends infer R extends RetType<F, [A0, A1, A2]> ?
      R
    : never
  : never;
/**
 * The **unsafe** version of {@linkcode Call3} (i.e., no type checking with {@linkcode F},
 * {@linkcode A0}, {@linkcode A1}, {@linkcode A2} and return type).
 */
export type Call3W<F, A0, A1, A2> =
  F & { readonly Args: (_: [A0, A1, A2]) => void } extends (
    infer F extends { readonly return: unknown }
  ) ?
    F["return"]
  : never;
/**
 * The same as {@linkcode Call3W}, but when {@linkcode F} is not a “concrete” type lambda,
 * {@linkcode TolerantRetTypeW} is used to provide a default result instead of `never`.
 *
 * This can be useful for classical HKTs, see {@linkcode Kind}.
 */
export type Kind3<F, T, U, V> =
  F & { readonly Args: (_: [T, U, V]) => void } extends (
    infer F extends { readonly return: unknown }
  ) ?
    F["return"]
  : TolerantRetTypeW<F>;
/**
 * A shorthand for `Apply<F, [A0, A1, A2, A3]>`.
 *
 * @see {@linkcode Apply}
 */
export type Call4<
  F extends TypeLambda4<never, never, never, never, unknown>,
  A0 extends TolerantParams<F>[0],
  A1 extends TolerantParams<F>[1],
  A2 extends TolerantParams<F>[2],
  A3 extends TolerantParams<F>[3],
> =
  F & { readonly Args: (_: [A0, A1, A2, A3]) => void } extends (
    infer F2 extends { readonly signature: (...args: any) => unknown; readonly return: unknown }
  ) ?
    F2["return"] extends infer R extends RetType<F, [A0, A1, A2, A3]> ?
      R
    : never
  : never;
/**
 * The **unsafe** version of {@linkcode Call4} (i.e., no type checking with {@linkcode F},
 * {@linkcode A0}, {@linkcode A1}, {@linkcode A2}, {@linkcode A3} and return type).
 */
export type Call4W<F, A0, A1, A2, A3> =
  F & { readonly Args: (_: [A0, A1, A2, A3]) => void } extends (
    infer F extends { readonly return: unknown }
  ) ?
    F["return"]
  : never;
/**
 * The same as {@linkcode Call4W}, but when {@linkcode F} is not a “concrete” type lambda,
 * {@linkcode TolerantRetTypeW} is used to provide a default result instead of `never`.
 *
 * This can be useful for classical HKTs, see {@linkcode Kind}.
 */
export type Kind4<F, T, U, V, W> =
  F & { readonly Args: (_: [T, U, V, W]) => void } extends (
    infer F extends { readonly return: unknown }
  ) ?
    F["return"]
  : TolerantRetTypeW<F>;

/********************
 * Common utilities *
 ********************/
/**
 * [Fn] A {@linkcode TypeLambda} that always returns the same value.
 *
 * Sig: `<T>() => T`
 *
 * @example
 * ```typescript
 * type Always42 = Always<42>;
 *
 * type Always42Sig = Sig<Always42>; // => () => 42
 * type _ = Apply<Always42, [42]>; // => 42
 * ```
 */
export interface Always<T> extends TypeLambda<[], T> {
  return: T;
}

/**
 * [Fn] A {@linkcode TypeLambda} that always returns the input value.
 *
 * Sig: `<T>(value: T) => T`
 *
 * @example
 * ```typescript
 * type _ = Apply<Identity, [42]>; // => 42
 * ```
 */
export interface Identity extends TypeLambdaG<["T"]> {
  signature: (value: TArg<this, "T">) => TArg<this, "T">;
  return: Arg0<this>;
}

/**
 * [Fn] Ask for a value of type {@linkcode T}. Useful for type inference when composing multiple
 * {@linkcode TypeLambda}s together.
 *
 * Sig: `<T>(value: T) => T`
 *
 * @example
 * ```typescript
 * type AskNumber = Ask<number>;
 * type AskNumberSig = Sig<AskNumber>; // => (value: number) => number
 * type _1 = Apply<AskNumber, [42]>; // => 42
 *
 * // Fix the input type of `Identity` to `string`
 * type AskString = Flow<Ask<string>, Identity>;
 * type AskStringSig = Sig<AskString>; // => (value: string) => string
 * type _2 = Apply<AskString, ["foo"]>; // => "foo"
 * ```
 */
export interface Ask<T> extends TypeLambda<[value: T], T> {
  return: Arg0<this>;
}

/**
 * Create a tupled version of the given {@linkcode TypeLambda} {@linkcode F}: instead of taking
 * variadic arguments, it takes a single tuple argument.
 *
 * @example
 * ```typescript
 * interface Add extends TypeLambda<[a: number, b: number], number> {
 *   return: [..._BuildTuple<Arg0<this>>, ..._BuildTuple<Arg1<this>>]["length"];
 * }
 * type _BuildTuple<Length extends number, Fill = void, Acc extends Fill[] = []> =
 *   [Length] extends [never] ? never
 *   : Acc["length"] extends Length ? Acc
 *   : _BuildTuple<Length, Fill, [...Acc, Fill]>;
 *
 * type AddSig = Sig<Add>; // => (a: number, b: number) => number
 * type _1 = Apply<Add, [1, 2]>; // => 3
 *
 * type TupledAdd = Tupled<Add>;
 * type TupledAddSig = Sig<TupledAdd>; // => (args: [a: number, b: number]) => number
 * type _2 = Apply<TupledAdd, [[1, 2]]>; // => 3
 * ```
 *
 * @see {@linkcode Untupled} for the inverse operation.
 */
export type Tupled<F extends TypeLambda<never, unknown>> =
  F extends TypeLambdaG ? TupledGeneric<F> : TupledNormal<F>;
export interface TupledNormal<F extends TypeLambda<never, unknown>>
  extends TypeLambda<[args: Params<F>], RetType<F>> {
  readonly return: ApplyW<F, Arg0<this>>;
}
export interface TupledGeneric<F extends TypeLambdaG & TypeLambda<never, unknown>>
  extends TypeLambdaG {
  readonly ["~hkt"]: F["~hkt"];
  readonly signature: (F & _PickTypeArgs<this>)["signature"] extends infer S ?
    (args: ParametersW<S>) => ReturnTypeW<S>
  : never;
  readonly return: ApplyW<F, Arg0<this>>;
}

/**
 * Inverse of {@linkcode Tupled}: convert a tupled {@linkcode TypeLambda} back to a variadic one.
 *
 * @example
 * ```typescript
 * interface First extends TypeLambdaG<["T"]> {
 *   signature: (pair: [TArg<this, "T">, unknown]) => TArg<this, "T">;
 *   return: Arg0<this>[0];
 * }
 *
 * type FirstSig = Sig<First>; // => <T>(pair: [T, unknown]) => T
 * type _1 = Apply<First, [[42, "foo"]]>; // => 42
 *
 * type UntupledFirst = Untupled<First>;
 * type UntupledFirstSig = Sig<UntupledFirst>; // => <T>(args_0: T, args_1: unknown) => T
 * type _2 = Apply<UntupledFirst, [42, "foo"]>; // => 42
 * ```
 */
export type Untupled<F extends TypeLambda1<any, unknown>> =
  F extends TypeLambdaG ? UntupledGeneric<F> : UntupledNormal<F>;
export interface UntupledNormal<F extends TypeLambda1<any, unknown>>
  extends TypeLambda<[...args: Param0<F>], RetType<F>> {
  readonly return: Call1W<F, Args<this>>;
}
export interface UntupledGeneric<F extends TypeLambdaG & TypeLambda1<any, unknown>>
  extends TypeLambdaG {
  readonly ["~hkt"]: F["~hkt"];
  readonly signature: (F & _PickTypeArgs<this>)["signature"] extends infer S ?
    (
      ...args: ParametersW<S>[0] extends readonly unknown[] ? ParametersW<S>[0] : never
    ) => ReturnTypeW<S>
  : never;
  readonly return: Call1W<F, Args<this>>;
}

/**
 * Flip the arguments of of a {@linkcode TypeLambda}.
 *
 * Sig1: `<T, U, V>(f: (x: T) => (y: U) => V) => (y: U) => (x: T) => V`
 *
 * Sig2: `<T, U, V>(f: (x: T, y: U) => V) => (y: U, x: T) => V`
 *
 * @example
 * ```typescript
 * // Flip the arguments of a binary type-level function
 * interface Append<Suffix extends string> extends TypeLambda<[s: string], string> {
 *   return: `${Arg0<this>}${Suffix}`;
 * }
 *
 * interface Map extends TypeLambdaG<["T", "U"]> {
 *   signature: (f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>, xs: TArg<this, "T">[]) => TArg<this, "U">[];
 *   return: _Map<Arg0<this>, Arg1<this>>;
 * }
 * type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };
 *
 * type MapSig = Sig<Map>; // => <T, U>(f: (x: T) => U, xs: T[]) => U[]
 * type _1 = Apply<Map, [Append<"!">, ["foo", "bar"]]>; // => ["foo!", "bar!"]
 *
 * type FlippedMap = Flip<Map>;
 * type FlippedMapSig = Sig<FlippedMap>; // => <T, U>(xs: T[], f: (x: T) => U) => U[]
 * type _2 = Apply<FlippedMap, [["foo", "bar"], Append<"!">]>; // => ["foo!", "bar!"]
 * ```
 *
 * @example
 * ```TypeScript
 * // Flip the arguments of a curried binary type-level function
 * type CurriedMap = Curry<Map>;
 * type CurriedMapSig = Sig<CurriedMap>; // => <T, U>(f: (x: T) => U) => (xs: T[]) => U[]
 * type _1 = Apply<Apply<CurriedMap, [Append<"!">]>, [["foo", "bar"]]>; // => ["foo!", "bar!"]
 *
 * type FlippedCurriedMap = Flip<CurriedMap>;
 * type FlippedCurriedMapSig = Sig<FlippedCurriedMap>; // => <T, U>(xs: T[]) => (f: (x: T) => U) => U[]
 * type _2 = Apply<FlippedCurriedMap, [["foo", "bar"], Append<"!">]>; // => ["foo!", "bar!"]
 * ```
 */
export type Flip<
  F extends TypeLambda1<never, TypeLambda1<never, unknown>> | TypeLambda2<never, never, unknown>,
> =
  F extends TypeLambda1<never, TypeLambda1<never, unknown>> ? Flip1<F>
  : F extends TypeLambda2<never, never, unknown> ? Flip2<F>
  : never;
/* Flip `TypeLambda2` */
type Flip2<F extends TypeLambda2<never, never, unknown>> =
  F extends TypeLambdaG ? Flip2Generic<F> : Flip2Normal<F>;
export interface Flip2Normal<F extends TypeLambda2<never, never, unknown>>
  // Use `GetPart` to preserve tuple labels
  extends TypeLambda<[...GetPart<Params<F>, 1>, ...HeadPart<Params<F>>], RetType<F>> {
  readonly return: Call2W<F, RawArg1<this>, RawArg0<this>>;
}
export interface Flip2Generic<F extends TypeLambdaG & TypeLambda2<never, never, unknown>>
  extends TypeLambdaG {
  readonly ["~hkt"]: F["~hkt"];
  readonly signature: (F & _PickTypeArgs<this>)["signature"] extends infer S ?
    // Use `GetPart` to preserve tuple labels
    (...args: [...GetPart<ParametersW<S>, 1>, ...HeadPart<ParametersW<S>>]) => ReturnTypeW<S>
  : never;
  readonly return: Call2W<F, RawArg1<this>, RawArg0<this>>;
}
/* Flip `TypeLambda1<never, TypeLambda1>` */
type Flip1<F extends TypeLambda1<never, TypeLambda1<never, unknown>>> =
  F extends TypeLambdaG ? Flip1Generic<F> : Flip1Normal<F>;
export interface Flip1Normal<F extends TypeLambda1<never, TypeLambda1<never, unknown>>>
  // Use `GetPart` to preserve tuple labels
  extends TypeLambda<Params<RetType<F>>, TypeLambda<Params<F>, RetType<RetType<F>>>> {
  readonly return: _Flip1Normal<F, RawArg0<this>>;
}
interface _Flip1Normal<F extends TypeLambda1<never, TypeLambda1<never, unknown>>, A1>
  extends TypeLambda<Params<F>, RetType<RetType<F>>> {
  readonly return: Call1W<Call1W<F, RawArg0<this>>, A1>;
}
export interface Flip1Generic<
  F extends TypeLambdaG & TypeLambda1<never, TypeLambda1<never, unknown>>,
> extends TypeLambdaG {
  readonly ["~hkt"]: F["~hkt"];
  readonly signature: (F & _PickTypeArgs<this>)["signature"] extends infer S ?
    (...args: ParamsW<ReturnTypeW<S>>) => TypeLambda<ParametersW<S>, RetTypeW<ReturnTypeW<S>>>
  : never;
  readonly return: _Flip1Generic<F, RawArg0<this>>;
}
interface _Flip1Generic<F extends TypeLambdaG & TypeLambda1<never, TypeLambda1<never, unknown>>, A1>
  extends TypeLambda<
    // `any` in `TypeLambda1<In<A1>, any>` here is intentional to avoid variance issues
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
    Params<_FlipIntermediateParameterVarianceForCurried2<F>, { r: TypeLambda1<In<A1>, any> }>,
    RetTypeW<
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
      RetType<_FlipIntermediateParameterVarianceForCurried2<F>, { r: TypeLambda1<In<A1>, any> }>
    >
  > {
  readonly return: Call1W<Call1W<F, RawArg0<this>>, A1>;
}
interface _FlipIntermediateParameterVarianceForCurried2<F extends TypeLambda<never, unknown>>
  extends TypeLambda {
  readonly ["~hkt"]: F["~hkt"];
  readonly signature: _WrapInForIntermediateParameterOfCurried2<
    (F & _PickTypeArgs<this>)["signature"]
  >;
}
type _WrapInForIntermediateParameterOfCurried2<S> = (
  ...args: ParametersW<S>
) => TypeLambda<
  ParamsW<ReturnTypeW<S>> extends infer Params extends unknown[] ?
    { [K in keyof Params]: In<Params[K]> }
  : never,
  RetTypeW<ReturnTypeW<S>>
>;

/**
 * Curry a {@linkcode TypeLambda} to a {@linkcode TypeLambda1}.
 *
 * Only support currying up to 4 arguments.
 *
 * Sig1: `<T, U, V>(f: (x: T, y: U) => V) => (x: T) => (y: U) => V`
 *
 * Sig2: `<T, U, V, W>(f: (x: T, y: U, z: V) => W) => (x: T) => (y: U) => (z: V) => W`
 *
 * Sig3: `<T, U, V, W, X>(f: (x: T, y: U, z: V, w: W) => X) => (x: T) => (y: U) => (z: V) => (w: W) => X`
 *
 * @example
 * ```typescript
 * // Curry a binary type-level function
 * interface Append<Suffix extends string> extends TypeLambda<[s: string], string> {
 *   return: `${Arg0<this>}${Suffix}`;
 * }
 *
 * interface Map extends TypeLambdaG<["T", "U"]> {
 *   signature: (f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>, xs: TArg<this, "T">[]) => TArg<this, "U">[];
 *   return: _Map<Arg0<this>, Arg1<this>>;
 * }
 * type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };
 *
 * type MapSig = Sig<Map>; // => <T, U>(f: (x: T) => U, xs: T[]) => U[]
 * type _1 = Apply<Map, [Append<"!">, ["foo", "bar"]]>; // => ["foo!", "bar!"]
 *
 * type CurriedMap = Curry<Map>;
 * type CurriedMapSig = Sig<CurriedMap>; // => <T, U>(f: (x: T) => U) => (xs: T[]) => U[]
 * type _2 = Apply<Apply<CurriedMap, [Append<"!">]>, [["foo", "bar"]]>; // => ["foo!", "bar!"]
 * ```
 *
 * @example
 * ```typescript
 * interface Concat extends TypeLambda<[s1: string, s2: string], string> {
 *   return: `${Arg0<this>}${Arg1<this>}`;
 * }
 *
 * interface Reduce extends TypeLambdaG<["T", "U"]> {
 *   signature: (
 *     f: TypeLambda<[acc: TArg<this, "U">, x: TArg<this, "T">], TArg<this, "U">>,
 *     init: TArg<this, "U">,
 *     xs: TArg<this, "T">[],
 *   ) => TArg<this, "U">;
 *   return: _Reduce<Arg0<this>, Arg1<this>, Arg2<this>>;
 * }
 * type _Reduce<F, Acc, TS> =
 *   TS extends readonly [infer Head, ...infer Tail] ? _Reduce<F, Call2W<F, Acc, Head>, Tail>
 *   : Acc;
 *
 * type ReduceSig = Sig<Reduce>; // => <T, U>(f: (acc: U, x: T) => U, init: U, xs: T[]) => U
 * type _1 = Apply<Reduce, [Concat, "", ["foo", "bar", "baz"]]>; // => "foobarbaz"
 *
 * type CurriedReduce = Curry<Reduce>;
 * type CurriedReduceSig = Sig<CurriedReduce>;
 * // => <T, U>(f: (acc: U, x: T) => U) => (init: U) => (xs: T[]) => U
 * type _2 = Apply<Apply<Apply<CurriedReduce, [Concat]>, [""]>, [["foo", "bar", "baz"]]>;
 * // => "foobarbaz"
 * ```
 */
export type Curry<
  F extends
    | TypeLambda1<never, unknown>
    | TypeLambda2<never, never, unknown>
    | TypeLambda3<never, never, never, unknown>
    | TypeLambda4<never, never, never, never, unknown>,
> =
  F extends TypeLambda1<never, unknown> ? F
  : F extends TypeLambda2<never, never, unknown> ? Curry2<F>
  : F extends TypeLambda3<never, never, never, unknown> ? Curry3<F>
  : F extends TypeLambda4<never, never, never, never, unknown> ? Curry4<F>
  : never;
/* Curry `TypeLambda2` */
type Curry2<F extends TypeLambda2<never, never, unknown>> =
  F extends TypeLambdaG ? Curry2Generic<F> : Curry2Normal<F>;
export interface Curry2Normal<F extends TypeLambda2<never, never, unknown>>
  // Use `GetPart` to preserve tuple labels
  extends TypeLambda<[...HeadPart<Params<F>>], TypeLambda<[...GetPart<Params<F>, 1>], RetType<F>>> {
  readonly return: _Curry2Normal<F, RawArg0<this>>;
}
interface _Curry2Normal<F extends TypeLambda2<never, never, unknown>, A0>
  extends TypeLambda<[...GetPart<Params<F>, 1>], RetType<F>> {
  readonly return: Call2W<F, A0, RawArg0<this>>;
}
export interface Curry2Generic<F extends TypeLambdaG & TypeLambda2<never, never, unknown>>
  extends TypeLambdaG {
  readonly ["~hkt"]: F["~hkt"];
  readonly signature: (F & _PickTypeArgs<this>)["signature"] extends infer S ?
    // Use `GetPart` to preserve tuple labels
    (
      ...args: [...HeadPart<ParametersW<S>>]
    ) => TypeLambda<[...GetPart<ParametersW<S>, 1>], ReturnTypeW<S>>
  : never;
  readonly return: _Curry2Generic<F, RawArg0<this>>;
}
interface _Curry2Generic<F extends TypeLambdaG & TypeLambda2<never, never, unknown>, A0>
  // Use `GetPart` to preserve tuple labels
  extends TypeLambda<[...GetPart<Params<F, [A0]>, 1>], RetType<F, [A0]>> {
  readonly return: Call2W<F, A0, RawArg0<this>>;
}
/* Curry `TypeLambda3` */
type Curry3<F extends TypeLambda3<never, never, never, unknown>> =
  F extends TypeLambdaG ? Curry3Generic<F> : Curry3Normal<F>;
export interface Curry3Normal<F extends TypeLambda3<never, never, never, unknown>>
  // Use `HeadPart` to preserve tuple labels
  extends TypeLambda<
    [...HeadPart<Params<F>>],
    TypeLambda<[...GetPart<Params<F>, 1>], TypeLambda<[...GetPart<Params<F>, 2>], RetType<F>>>
  > {
  readonly return: _Curry3Normal<F, RawArg0<this>>;
}
interface _Curry3Normal<F extends TypeLambda3<never, never, never, unknown>, A0>
  extends TypeLambda<
    [...GetPart<Params<F>, 1>],
    TypeLambda<[...GetPart<Params<F>, 2>], RetType<F>>
  > {
  readonly return: __Curry3Normal<F, A0, RawArg0<this>>;
}
interface __Curry3Normal<F extends TypeLambda3<never, never, never, unknown>, A0, A1>
  extends TypeLambda<[...GetPart<Params<F>, 2>], RetType<F>> {
  readonly return: Call3W<F, A0, A1, RawArg0<this>>;
}
export interface Curry3Generic<F extends TypeLambdaG & TypeLambda3<never, never, never, unknown>>
  extends TypeLambdaG {
  readonly ["~hkt"]: F["~hkt"];
  readonly signature: (F & _PickTypeArgs<this>)["signature"] extends infer S ?
    // Use `GetPart` to preserve tuple labels
    (
      ...args: [...HeadPart<ParametersW<S>>]
    ) => TypeLambda<
      [...GetPart<ParametersW<S>, 1>],
      TypeLambda<[...GetPart<ParametersW<S>, 2>], ReturnTypeW<S>>
    >
  : never;
  readonly return: _Curry3Generic<F, RawArg0<this>>;
}
interface _Curry3Generic<F extends TypeLambdaG & TypeLambda3<never, never, never, unknown>, A0>
  // Use `GetPart` to preserve tuple labels
  extends TypeLambda<
    [...GetPart<Params<F, [A0]>, 1>],
    TypeLambda<[...GetPart<Params<F, [A0]>, 2>], RetType<F, [A0]>>
  > {
  readonly return: __Curry3Generic<F, A0, RawArg0<this>>;
}
interface __Curry3Generic<F extends TypeLambdaG & TypeLambda3<never, never, never, unknown>, A0, A1>
  // Use `GetPart` to preserve tuple labels
  extends TypeLambda<[...GetPart<Params<F, [A0, A1]>, 2>], RetType<F, [A0, A1]>> {
  readonly return: Call3W<F, A0, A1, RawArg0<this>>;
}
/* Curry `TypeLambda4` */
type Curry4<F extends TypeLambda4<never, never, never, never, unknown>> =
  F extends TypeLambdaG ? Curry4Generic<F> : Curry4Normal<F>;
export interface Curry4Normal<F extends TypeLambda4<never, never, never, never, unknown>>
  // Use `HeadPart` to preserve tuple labels
  extends TypeLambda<
    [...HeadPart<Params<F>>],
    TypeLambda<
      [...GetPart<Params<F>, 1>],
      TypeLambda<[...GetPart<Params<F>, 2>], TypeLambda<[...GetPart<Params<F>, 3>], RetType<F>>>
    >
  > {
  readonly return: _Curry4Normal<F, RawArg0<this>>;
}
interface _Curry4Normal<F extends TypeLambda4<never, never, never, never, unknown>, A0>
  extends TypeLambda<
    [...GetPart<Params<F>, 1>],
    TypeLambda<[...GetPart<Params<F>, 2>], TypeLambda<[...GetPart<Params<F>, 3>], RetType<F>>>
  > {
  readonly return: __Curry4Normal<F, A0, RawArg0<this>>;
}
interface __Curry4Normal<F extends TypeLambda4<never, never, never, never, unknown>, A0, A1>
  extends TypeLambda<
    [...GetPart<Params<F>, 2>],
    TypeLambda<[...GetPart<Params<F>, 3>], RetType<F>>
  > {
  readonly return: ___Curry4Normal<F, A0, A1, RawArg0<this>>;
}
interface ___Curry4Normal<F extends TypeLambda4<never, never, never, never, unknown>, A0, A1, A2>
  extends TypeLambda<[...GetPart<Params<F>, 3>], RetType<F>> {
  readonly return: Call4W<F, A0, A1, A2, RawArg0<this>>;
}
export interface Curry4Generic<
  F extends TypeLambdaG & TypeLambda4<never, never, never, never, unknown>,
> extends TypeLambdaG {
  readonly ["~hkt"]: F["~hkt"];
  readonly signature: (F & _PickTypeArgs<this>)["signature"] extends infer S ?
    // Use `GetPart` to preserve tuple labels
    (
      ...args: [...HeadPart<ParametersW<S>>]
    ) => TypeLambda<
      [...GetPart<ParametersW<S>, 1>],
      TypeLambda<
        [...GetPart<ParametersW<S>, 2>],
        TypeLambda<[...GetPart<ParametersW<S>, 3>], ReturnTypeW<S>>
      >
    >
  : never;
  readonly return: _Curry4Generic<F, RawArg0<this>>;
}
interface _Curry4Generic<
    F extends TypeLambdaG & TypeLambda4<never, never, never, never, unknown>,
    A0,
  >
  // Use `GetPart` to preserve tuple labels
  extends TypeLambda<
    [...GetPart<Params<F, [A0]>, 1>],
    TypeLambda<
      [...GetPart<Params<F, [A0]>, 2>],
      TypeLambda<[...GetPart<Params<F, [A0]>, 3>], RetType<F, [A0]>>
    >
  > {
  readonly return: __Curry4Generic<F, A0, RawArg0<this>>;
}
interface __Curry4Generic<
    F extends TypeLambdaG & TypeLambda4<never, never, never, never, unknown>,
    A0,
    A1,
  >
  // Use `GetPart` to preserve tuple labels
  extends TypeLambda<
    [...GetPart<Params<F, [A0, A1]>, 2>],
    TypeLambda<[...GetPart<Params<F, [A0, A1]>, 3>], RetType<F, [A0, A1]>>
  > {
  readonly return: ___Curry4Generic<F, A0, A1, RawArg0<this>>;
}
interface ___Curry4Generic<
    F extends TypeLambdaG & TypeLambda4<never, never, never, never, unknown>,
    A0,
    A1,
    A2,
  >
  // Use `GetPart` to preserve tuple labels
  extends TypeLambda<[...GetPart<Params<F, [A0, A1, A2]>, 3>], RetType<F, [A0, A1, A2]>> {
  readonly return: Call4W<F, A0, A1, A2, RawArg0<this>>;
}

/**
 * Partially apply a {@linkcode TypeLambda} by providing some of its arguments.
 *
 * Similar to the `Known` argument in {@linkcode TypeArgs}, {@linkcode Params} and {@linkcode RetType},
 * the {@linkcode Args} argument in this utility should be an object with integer keys (tuples are
 * also supported since they satisfy this condition), where the integer keys represent the positions
 * of the arguments being provided, and the values represent the types being provided for those
 * arguments.
 *
 * **⚠️ Warning:** This utility does not type check whether the provided arguments are valid
 * for the given {@linkcode TypeLambda}. Use with caution.
 *
 * @example
 * ```typescript
 * interface Concat extends TypeLambda<[s1: string, s2: string], string> {
 *   return: `${Arg0<this>}${Arg1<this>}`;
 * }
 *
 * type ConcatSig = Sig<Concat>; // => (s1: string, s2: string) => string
 * type _1 = Apply<Concat, ["Hello, ", "world!"]>; // => "Hello, world!"
 *
 * type Greet = PartialApply<Concat, ["Hello, "]>;
 * type GreetSig = Sig<Greet>; // => (s2: string) => string
 * type _2 = Apply<Greet, ["world!"]>; // => "Hello, world!"
 *
 * type SayWorld = PartialApply<Concat, { 1: "world!" }>;
 * type SayWorldSig = Sig<SayWorld>; // => (s1: string) => string
 * type _3 = Apply<SayWorld, ["Hello, "]>; // => "Hello, world!"
 * ```
 *
 * @example
 * ```typescript
 * // Handling generic TypeLambdas
 * interface Reduce extends TypeLambdaG<["T", "U"]> {
 *   signature: (
 *     f: TypeLambda<[acc: TArg<this, "U">, x: TArg<this, "T">], TArg<this, "U">>,
 *     init: TArg<this, "U">,
 *     xs: TArg<this, "T">[],
 *   ) => TArg<this, "U">;
 *   return: _Reduce<Arg0<this>, Arg1<this>, Arg2<this>>;
 * }
 * type _Reduce<F, Acc, TS> =
 *   TS extends readonly [infer Head, ...infer Tail] ? _Reduce<F, Call2W<F, Acc, Head>, Tail>
 *   : Acc;
 *
 * type ReduceSig = Sig<Reduce>; // => <T, U>(f: (acc: U, x: T) => U, init: U, xs: T[]) => U
 * type _1 = Apply<Reduce, [Concat, "", ["foo", "bar", "baz"]]>; // => "foobarbaz"
 *
 * type ConcatAll = PartialApply<Reduce, [Concat, ""]>;
 * type ConcatAllSig = Sig<ConcatAll>; // => (xs: string[]) => string
 * type _2 = Apply<ConcatAll, [["foo", "bar", "baz"]]>; // => "foobarbaz"
 *
 * type ReduceFooBarBaz = PartialApply<Reduce, { 2: ["foo", "bar", "baz"] }>;
 * type ReduceFooBarBazSig = Sig<ReduceFooBarBaz>; // => <U>(f: (acc: U, x: "foo" | "bar" | "baz") => U, init: U) => U
 * type _3 = Apply<ReduceFooBarBaz, [Concat, ""]>; // => "foobarbaz"
 * ```
 */
export type PartialApply<
  F extends
    | TypeLambda1<never, unknown>
    | TypeLambda2<never, never, unknown>
    | TypeLambda3<never, never, never, unknown>
    | TypeLambda4<never, never, never, never, unknown>,
  Args,
> =
  F extends TypeLambdaG ?
    _OmitFixedTypeParams<F["~hkt"]["tparams"], TypeArgs<F, Args>> extends [] ?
      PartialNormal<F & TypeArgs<F, Args>, Args>
    : PartialGeneric<F, Args>
  : PartialNormal<F, Args>;
type _OmitFixedTypeParams<
  TypeParams extends TypeParameter[],
  TypeArgs,
  Result extends TypeParameter[] = [],
> =
  TypeParams extends (
    readonly [infer Head extends TypeParameter, ...infer Tail extends TypeParameter[]]
  ) ?
    `~${Head[0]}` extends keyof TypeArgs ?
      _OmitFixedTypeParams<Tail, TypeArgs, Result>
    : _OmitFixedTypeParams<Tail, TypeArgs, [...Result, Head]>
  : Result;
type _OmitProvidedArgsInParams<
  Params extends unknown[],
  ProvidedArgs,
  Counter extends void[] = [],
  Result extends unknown[] = [],
> =
  Params extends [infer _, ...infer Tail] ?
    Counter["length"] extends IndexOf<ProvidedArgs> ?
      _OmitProvidedArgsInParams<Tail, ProvidedArgs, [...Counter, void], Result>
    : _OmitProvidedArgsInParams<
        Tail,
        ProvidedArgs,
        [...Counter, void],
        // Use `GetPart` to preserve tuple labels
        [...Result, ...GetPart<Params, 0>]
      >
  : Result;
type _RebuildFullArgsFromPartial<
  PartialArgs extends unknown[],
  ProvidedArgs,
  Counter extends void[] = [],
  Result extends unknown[] = [],
> =
  Counter["length"] extends IndexOf<ProvidedArgs> ?
    _RebuildFullArgsFromPartial<
      PartialArgs,
      ProvidedArgs,
      [...Counter, void],
      [...Result, ProvidedArgs[Counter["length"]]]
    >
  : PartialArgs extends [infer PHead, ...infer PTail] ?
    _RebuildFullArgsFromPartial<PTail, ProvidedArgs, [...Counter, void], [...Result, PHead]>
  : Result;
export interface PartialNormal<F extends TypeLambda<never, unknown>, ProvidedArgs>
  extends TypeLambda<_OmitProvidedArgsInParams<Params<F>, ProvidedArgs>, RetType<F>> {
  readonly return: ApplyW<F, _RebuildFullArgsFromPartial<RawArgs<this>, ProvidedArgs>>;
}
export interface PartialGeneric<F extends TypeLambdaG, ProvidedArgs> extends TypeLambdaG {
  readonly ["~hkt"]: {
    [K in keyof F["~hkt"]]: K extends "tparams" ?
      _OmitFixedTypeParams<F["~hkt"][K], TypeArgs<F, ProvidedArgs>>
    : F["~hkt"][K];
  };
  readonly signature: (F & TypeArgs<F, ProvidedArgs> & _PickTypeArgs<this>)["signature"] extends (
    infer S
  ) ?
    (...args: _OmitProvidedArgsInParams<ParametersW<S>, ProvidedArgs>) => ReturnTypeW<S>
  : never;
  readonly return: ApplyW<F, _RebuildFullArgsFromPartial<RawArgs<this>, ProvidedArgs>>;
}

/**
 * Compose two {@linkcode TypeLambda1}s from right to left. Generics are elegantly handled.
 *
 * @example
 * ```typescript
 * interface ParseNumber extends TypeLambda<[s: string], number> {
 *   return: Arg0<this> extends `${infer N extends number}` ? N : never;
 * }
 * interface Add1 extends TypeLambda<[n: number], number> {
 *   return: [..._BuildTuple<Arg0<this>, void>, void]["length"];
 * }
 * type _BuildTuple<Length extends number, Fill, Acc extends Fill[] = []> =
 *   [Length] extends [never] ? never
 *   : Acc["length"] extends Length ? Acc
 *   : _BuildTuple<Length, Fill, [...Acc, Fill]>;
 *
 * type F = Compose<Add1, ParseNumber>;
 * type S = Sig<F>; // => (s: string) => number
 * type R = Apply<F, ["42"]>; // => 43
 * ```
 *
 * @example
 * ```
 * // Handling generic TypeLambdas
 * interface MakeTuple extends TypeLambdaG<["T"]> {
 *   signature: (value: TArg<this, "T">) => [TArg<this, "T">];
 *   return: [Arg0<this>];
 * }
 * type MakeTupleSig = Sig<MakeTuple>; // => <T>(value: T) => [T]
 *
 * interface IsTuple1 extends TypeLambda<[value: unknown], boolean> {
 *   return: Arg0<this> extends [unknown] ? true : false;
 * }
 *
 * // When `F` is a not generic TypeLambda, but `G` is
 * type _1 = Sig<Compose<MakeTuple, Ask<string>>>; // => (x: string) => [string]
 * // When `F` is a generic TypeLambda, but `G` is not
 * type _2 = Sig<Compose<IsTuple1, MakeTuple>>; // => (value: unknown) => boolean
 *
 * // When both `F` and `G` are generic TypeLambdas, the result is still a generic TypeLambda
 * type ToNestedTuple = Sig<Compose<MakeTuple, MakeTuple>>;
 * type ToNestedTupleSig = Sig<ToNestedTuple>; // => <T>(value: T) => [[T]]
 * ```
 */
export type Compose<
  G extends TypeLambda1<RetType<F>, unknown>,
  F extends TypeLambda1<never, unknown>,
> =
  F extends TypeLambdaG & TypeLambda1<never, unknown> ?
    G extends TypeLambdaG & TypeLambda1<RetType<F>, unknown> ?
      // Use `ComposeGeneric` only if both `F` and `G` are generic
      ComposeGeneric<G, F>
    : ComposeNormal<G, F>
  : ComposeNormal<G, F>;
/**
 * The **unsafe** version of {@linkcode Compose} (i.e., no type checking with {@linkcode F} and
 * {@linkcode G}).
 */
export type ComposeW<G, F> =
  F extends TypeLambdaG & TypeLambda1<never, unknown> ?
    G extends TypeLambdaG & TypeLambda1<RetType<F>, unknown> ? ComposeGeneric<G, F>
    : G extends TypeLambda1<RetType<F>, unknown> ? ComposeNormal<G, F>
    : never
  : F extends TypeLambda1<never, unknown> ?
    G extends TypeLambda1<RetType<F>, unknown> ?
      ComposeNormal<G, F>
    : never
  : never;
/**
 * Compose two {@linkcode TypeLambda1}s if either or none of them is generic.
 */
export interface ComposeNormal<
  G extends TypeLambda1<RetType<F>, unknown>,
  F extends TypeLambda1<never, unknown>,
> extends TypeLambda<Params<F, { r: Param0<G> }>, RetType<G, [RetType<F>]>> {
  readonly return: Call1W<G, Call1W<F, RawArg0<this>>>;
}
/**
 * Compose two {@linkcode TypeLambda1}s if both of them are generic.
 */
export interface ComposeGeneric<
  G extends TypeLambdaG & TypeLambda1<RetType<F>, unknown>,
  F extends TypeLambdaG & TypeLambda1<never, unknown>,
> extends TypeLambdaG {
  readonly ["~hkt"]: F["~hkt"];
  readonly signature: (F & _PickTypeArgs<this>)["signature"] extends infer S ?
    (...args: ParametersW<S>) => RetType<G, [ReturnTypeW<S>]>
  : never;
  readonly return: Call1W<G, Call1W<F, RawArg0<this>>>;
}

/**
 * Compose a list of {@linkcode TypeLambda}s (from left to right).
 * Supports up to 16 type lambdas.
 *
 * Type safety is **guaranteed**.
 *
 * @example
 * ```typescript
 * interface Lower extends TypeLambda<[s: string], string> {
 *   return: Lowercase<Arg0<this>>;
 * }
 * interface Cap extends TypeLambda<[s: string], string> {
 *   return: Capitalize<Arg0<this>>;
 * }
 *
 * interface Prepend<Prefix extends string> extends TypeLambda<[s: string], string> {
 *   return: `${Prefix}${Arg0<this>}`;
 * }
 *
 * type F = Flow<Lower, Prepend<"foo">, Cap>;
 * type S = Sig<F>; // => (s: string) => string
 * type R = Apply<F, ["bAr"]>; // => "Foobar"
 * ```
 */
export type Flow<
  A extends TypeLambda1<never, unknown>,
  B extends TypeLambda1<RetType<A>, unknown> = never,
  C extends TypeLambda1<RetType<B, [RetType<A>]>, unknown> = never,
  D extends TypeLambda1<RetType<C, [RetType<B, [RetType<A>]>]>, unknown> = never,
  E extends TypeLambda1<RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>, unknown> = never,
  // prettier-ignore
  F extends TypeLambda1<RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>]>, unknown> = never,
  // prettier-ignore
  G extends TypeLambda1<RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  H extends TypeLambda1<RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  I extends TypeLambda1<RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  J extends TypeLambda1<RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  K extends TypeLambda1<RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  L extends TypeLambda1<RetType<K, [RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  M extends TypeLambda1<RetType<L, [RetType<K, [RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  N extends TypeLambda1<RetType<M, [RetType<L, [RetType<K, [RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>]>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  O extends TypeLambda1<RetType<N, [RetType<M, [RetType<L, [RetType<K, [RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>]>]>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  P extends TypeLambda1<RetType<O, [RetType<N, [RetType<M, [RetType<L, [RetType<K, [RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A>]>]>]>]>]>]>]>]>]>]>]>]>]>]>, unknown> = never,
> =
  [B] extends [never] ? A
  : [C] extends [never] ? ComposeW<B, A>
  : [D] extends [never] ? ComposeW<C, ComposeW<B, A>>
  : [E] extends [never] ? ComposeW<D, ComposeW<C, ComposeW<B, A>>>
  : [F] extends [never] ? ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>
  : [G] extends [never] ? ComposeW<F, ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>>
  : [H] extends [never] ?
    ComposeW<G, ComposeW<F, ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>>>
  : [I] extends [never] ?
    ComposeW<H, ComposeW<G, ComposeW<F, ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>>>>
  : [J] extends [never] ?
    // prettier-ignore
    ComposeW<I, ComposeW<H, ComposeW<G, ComposeW<F, ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>>>>>
  : [K] extends [never] ?
    // prettier-ignore
    ComposeW<J, ComposeW<I, ComposeW<H, ComposeW<G, ComposeW<F, ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>>>>>>
  : [L] extends [never] ?
    // prettier-ignore
    ComposeW<K, ComposeW<J, ComposeW<I, ComposeW<H, ComposeW<G, ComposeW<F, ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>>>>>>>
  : [M] extends [never] ?
    // prettier-ignore
    ComposeW<L, ComposeW<K, ComposeW<J, ComposeW<I, ComposeW<H, ComposeW<G, ComposeW<F, ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>>>>>>>>
  : [N] extends [never] ?
    // prettier-ignore
    ComposeW<M, ComposeW<L, ComposeW<K, ComposeW<J, ComposeW<I, ComposeW<H, ComposeW<G, ComposeW<F, ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>>>>>>>>>
  : [O] extends [never] ?
    // prettier-ignore
    ComposeW<N, ComposeW<M, ComposeW<L, ComposeW<K, ComposeW<J, ComposeW<I, ComposeW<H, ComposeW<G, ComposeW<F, ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>>>>>>>>>>
  : [P] extends [never] ?
    // prettier-ignore
    ComposeW<O, ComposeW<N, ComposeW<M, ComposeW<L, ComposeW<K, ComposeW<J, ComposeW<I, ComposeW<H, ComposeW<G, ComposeW<F, ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>>>>>>>>>>>
  : // prettier-ignore
    ComposeW<P, ComposeW<O, ComposeW<N, ComposeW<M, ComposeW<L, ComposeW<K, ComposeW<J, ComposeW<I, ComposeW<H, ComposeW<G, ComposeW<F, ComposeW<E, ComposeW<D, ComposeW<C, ComposeW<B, A>>>>>>>>>>>>>>>;

/**
 * Pipe value through variadic {@linkcode TypeLambda}s (from left to right).
 * Supports up to 16 functions.
 *
 * Type safety is **guaranteed**.
 *
 * @example
 * ```typescript
 * interface Lower extends TypeLambda<[s: string], string> {
 *   return: Lowercase<Arg0<this>>;
 * }
 * interface Cap extends TypeLambda<[s: string], string> {
 *   return: Capitalize<Arg0<this>>;
 * }
 *
 * interface Prepend<Prefix extends string> extends TypeLambda<[s: string], string> {
 *   return: `${Prefix}${Arg0<this>}`;
 * }
 *
 * type _1 = Pipe<"bAr", Lower, Prepend<"foo">, Cap>; // => "Foobar"
 *
 * type F<S extends string> = Pipe<S, Lower, Prepend<"foo">, Cap>;
 * //   ^?: type F<S extends string> = `Foo${Lowercase<S>}`
 * type _2 = F<"bAr">; // => "Foobar"
 * ```
 */
export type Pipe<
  T,
  A extends TypeLambda1<T, unknown>,
  B extends TypeLambda1<RetType<A, [T]>, unknown> = never,
  C extends TypeLambda1<RetType<B, [RetType<A, [T]>]>, unknown> = never,
  D extends TypeLambda1<RetType<C, [RetType<B, [RetType<A, [T]>]>]>, unknown> = never,
  E extends TypeLambda1<RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>, unknown> = never,
  // prettier-ignore
  F extends TypeLambda1<RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  G extends TypeLambda1<RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  H extends TypeLambda1<RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  I extends TypeLambda1<RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  J extends TypeLambda1<RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  K extends TypeLambda1<RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  L extends TypeLambda1<RetType<K, [RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  M extends TypeLambda1<RetType<L, [RetType<K, [RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  N extends TypeLambda1<RetType<M, [RetType<L, [RetType<K, [RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>]>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  O extends TypeLambda1<RetType<N, [RetType<M, [RetType<L, [RetType<K, [RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>]>]>]>]>]>]>]>]>]>]>, unknown> = never,
  // prettier-ignore
  P extends TypeLambda1<RetType<O, [RetType<N, [RetType<M, [RetType<L, [RetType<K, [RetType<J, [RetType<I, [RetType<H, [RetType<G, [RetType<F, [RetType<E, [RetType<D, [RetType<C, [RetType<B, [RetType<A, [T]>]>]>]>]>]>]>]>]>]>]>]>]>]>]>, unknown> = never,
> =
  [B] extends [never] ? Call1W<A, T>
  : [C] extends [never] ? Call1W<B, Call1W<A, T>>
  : [D] extends [never] ? Call1W<C, Call1W<B, Call1W<A, T>>>
  : [E] extends [never] ? Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>
  : [F] extends [never] ? Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>
  : [G] extends [never] ? Call1W<F, Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>>
  : [H] extends [never] ?
    Call1W<G, Call1W<F, Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>>>
  : [I] extends [never] ?
    Call1W<H, Call1W<G, Call1W<F, Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>>>>
  : [J] extends [never] ?
    // prettier-ignore
    Call1W<I, Call1W<H, Call1W<G, Call1W<F, Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>>>>>
  : [K] extends [never] ?
    // prettier-ignore
    Call1W<J, Call1W<I, Call1W<H, Call1W<G, Call1W<F, Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>>>>>>
  : [L] extends [never] ?
    // prettier-ignore
    Call1W<K, Call1W<J, Call1W<I, Call1W<H, Call1W<G, Call1W<F, Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>>>>>>>
  : [M] extends [never] ?
    // prettier-ignore
    Call1W<L, Call1W<K, Call1W<J, Call1W<I, Call1W<H, Call1W<G, Call1W<F, Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>>>>>>>>
  : [N] extends [never] ?
    // prettier-ignore
    Call1W<M, Call1W<L, Call1W<K, Call1W<J, Call1W<I, Call1W<H, Call1W<G, Call1W<F, Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>>>>>>>>>
  : [O] extends [never] ?
    // prettier-ignore
    Call1W<N, Call1W<M, Call1W<L, Call1W<K, Call1W<J, Call1W<I, Call1W<H, Call1W<G, Call1W<F, Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>>>>>>>>>>
  : [P] extends [never] ?
    // prettier-ignore
    Call1W<O, Call1W<N, Call1W<M, Call1W<L, Call1W<K, Call1W<J, Call1W<I, Call1W<H, Call1W<G, Call1W<F, Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>>>>>>>>>>>
  : // prettier-ignore
    Call1W<P, Call1W<O, Call1W<N, Call1W<M, Call1W<L, Call1W<K, Call1W<J, Call1W<I, Call1W<H, Call1W<G, Call1W<F, Call1W<E, Call1W<D, Call1W<C, Call1W<B, Call1W<A, T>>>>>>>>>>>>>>>>;

/* Ensure TypeScript treats this file as a module to prevent internal from exportation */
export {};
