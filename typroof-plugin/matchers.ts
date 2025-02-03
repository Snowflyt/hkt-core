import { match } from "typroof/plugin";

/**
 * [Matcher] Check if a TypeLambda’s signature matches a given signature.
 *
 * Note: Parameter labels are also checked.
 */
export const beOfSig = <S extends (...args: any) => any>(
  // @ts-expect-error - `sig` is unused.
  sig?: S,
) => match<"beOfSig", S>();

/**
 * [Matcher] Check if a type equals one of the given types.
 */
export const beOneOf = <
  A = Placeholder,
  B = Placeholder,
  C = Placeholder,
  D = Placeholder,
  E = Placeholder,
  F = Placeholder,
  G = Placeholder,
  H = Placeholder,
  I = Placeholder,
  J = Placeholder,
  K = Placeholder,
  L = Placeholder,
  M = Placeholder,
  N = Placeholder,
  O = Placeholder,
  P = Placeholder,
  Q = Placeholder,
  R = Placeholder,
  S = Placeholder,
  T = Placeholder,
  U = Placeholder,
  V = Placeholder,
  W = Placeholder,
  X = Placeholder,
  Y = Placeholder,
  Z = Placeholder,
>(
  // @ts-expect-error - `a` is unused.
  a?: A,
  // @ts-expect-error - `b` is unused.
  b?: B,
  // @ts-expect-error - `c` is unused.
  c?: C,
  // @ts-expect-error - `d` is unused.
  d?: D,
  // @ts-expect-error - `e` is unused.
  e?: E,
) =>
  match<
    "beOneOf",
    _ExcludePlaceholders<
      [A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z]
    >
  >();
declare const placeholder: unique symbol;
type Placeholder = typeof placeholder;
type _ExcludePlaceholders<TS extends readonly unknown[]> =
  TS extends readonly [infer T, ...infer Rest] ?
    T extends Placeholder ?
      _ExcludePlaceholders<Rest>
    : [T, ..._ExcludePlaceholders<Rest>]
  : TS;

/**
 * [Matcher] Check if a type exactly equals another type.
 *
 * Note: Tuple labels are also checked.
 */
export const exactEqual = <U>(
  // @ts-expect-error - `y` is unused.
  y?: U,
) => match<"exactEqual", U>();
