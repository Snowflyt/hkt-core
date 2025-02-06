import type { Sig } from "../src";
import type { Actual, Expected, IsNegated, Stringify, ToAnalyze, Validator } from "typroof/plugin";

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

declare module "typroof/plugin" {
  interface ValidatorRegistry {
    beOfSig: BeOfSigValidator;
    beOneOf: BeOneOfValidator;
    exactEqual: ExactEqualValidator;
  }
}

interface BeOfSigValidator extends Validator {
  return: IsNegated<this> extends false ?
    IsOfSignature<Actual<this>, Expected<this>> extends false ?
      `Expect \`TypeLambda<${Stringify<Sig<Actual<this>>>}>\` to be of signature \`${Stringify<Expected<this>>}\`, but does not`
    : IsOfSignature<Actual<this>, Expected<this>>
  : IsOfSignature<Actual<this>, Expected<this>> extends false ? false
  : IsOfSignature<Actual<this>, Expected<this>>;
}
interface BeOneOfValidator extends Validator {
  return: IsNegated<this> extends false ?
    IsOneOf<Actual<this>, Expected<this>> extends true ?
      true
    : `Expect \`${Stringify<Actual<this>>}\` to be ${StringifyAll<Expected<this>>}, but does not`
  : IsOneOf<Actual<this>, Expected<this>> extends false ? false
  : `Expect \`${Stringify<Actual<this>>}\` not to be ${StringifyAll<Expected<this>>}, but does`;
}
interface ExactEqualValidator extends Validator {
  return: IsNegated<this> extends false ?
    Equals<Actual<this>, Expected<this>> extends true ?
      ToAnalyze<[Actual<this>, Expected<this>]>
    : `Expect \`${Stringify<Actual<this>>}\` to exactly equal \`${Stringify<Expected<this>>}\`, but does not`
  : Equals<Actual<this>, Expected<this>> extends false ? false
  : ToAnalyze<[Actual<this>, Expected<this>]>;
}

export {};
