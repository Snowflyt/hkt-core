import type { Sig } from "../src";
import type { Stringify, ToAnalyze } from "typroof";

/**
 * Checks whether `T` exactly equals `U`.
 *
 * @example
 * ```typescript
 * type _1 = Equals<1, 1>;
 * //   ^?: true
 * type _2 = Equals<1, number>;
 * //   ^?: false
 * type _3 = Equals<1, 1 | 2>;
 * //   ^?: false
 * ```
 */
export type Equals<T, U> =
  (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? true : false;

type IsOfSignature<F, S> = Equals<Sig<F>, S> extends true ? ToAnalyze<[Sig<F>, S]> : false;

type IsOneOf<T, TS> =
  TS extends readonly [infer H, ...infer R] ?
    Equals<T, H> extends true ?
      true
    : IsOneOf<T, R>
  : false;
type StringifyAll<TS> =
  TS extends readonly [infer Head] ? `\`${Stringify<Head>}\``
  : TS extends readonly [infer Head, infer Last] ?
    `\`${Stringify<Head>}\` or \`${Stringify<Last>}\``
  : TS extends readonly [infer Head, ...infer Tail] ?
    `\`${Stringify<Head>}\`, \`${StringifyAll<Tail>}\``
  : "";

declare module "typroof" {
  interface Validator<T, U, Not> {
    beOfSig: Not extends false ?
      IsOfSignature<T, U> extends false ?
        `Expect \`TypeLambda<${Stringify<Sig<T>>}>\` to be of signature \`${Stringify<U>}\`, but does not`
      : IsOfSignature<T, U>
    : IsOfSignature<T, U> extends false ? false
    : IsOfSignature<T, U>;
    beOneOf: Not extends false ?
      IsOneOf<T, U> extends true ?
        true
      : `Expect \`Stringify<T>\` to be ${StringifyAll<U>}, but does not`
    : IsOneOf<T, U> extends false ? false
    : `Expect \`Stringify<T>\` not to be ${StringifyAll<U>}, but does`;
    exactEqual: Not extends false ?
      Equals<T, U> extends true ?
        ToAnalyze<[T, U]>
      : `Expect \`${Stringify<T>}\` to exactly equal \`${Stringify<U>}\`, but does not`
    : Equals<T, U> extends false ? false
    : ToAnalyze<[T, U]>;
  }
}

export {};
