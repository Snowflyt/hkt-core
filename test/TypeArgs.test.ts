import { describe, equal, expect, it } from "typroof";

import type {
  Arg0,
  Arg1,
  Call1W,
  TArg,
  TypeArgs,
  TypeLambda,
  TypeLambda1,
  TypeLambdaG,
} from "../src";

describe("TypeArgs", () => {
  it("should infer type parameters", () => {
    interface Map extends TypeLambdaG<["T", "U"]> {
      signature: (
        f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
        xs: TArg<this, "T">[],
      ) => TArg<this, "U">[];
      return: _Map<Arg0<this>, Arg1<this>>;
    }
    type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

    expect<TypeArgs<Map, { 1: string[]; r: number[] }>>().to(
      equal<{ readonly "~T": string; readonly "~U": number }>,
    );
    expect<TypeArgs<Map, [TypeLambda1<number, boolean>]>>().to(
      equal<{ readonly "~T": number; readonly "~U": boolean }>,
    );
  });

  it("should only infer inferrable type parameters", () => {
    interface Map extends TypeLambdaG<["T", "U"]> {
      signature: (
        f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
        xs: TArg<this, "T">[],
      ) => TArg<this, "U">[];
      return: _Map<Arg0<this>, Arg1<this>>;
    }
    type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

    expect<TypeArgs<Map, { 1: string[] }>>().to(equal<{ readonly "~T": string }>);
  });

  it("should avoid irrelevant positions affecting inference", () => {
    interface Elem extends TypeLambdaG<["T"]> {
      signature: (xs: TArg<this, "T">[]) => TArg<this, "T">;
      return: Arg0<this>[number];
    }

    expect<TypeArgs<Elem, [string[]]>>().to(equal<{ readonly "~T": string }>);
    expect<TypeArgs<Elem, [(number | boolean)[]]>>().to(equal<{ readonly "~T": number | boolean }>);
    expect<TypeArgs<Elem, [any[]]>>().to(equal<{ readonly "~T": any }>);
    expect<TypeArgs<Elem, [never[]]>>().to(equal<{ readonly "~T": never }>);

    expect<TypeArgs<Elem, [never]>>().to(equal<{ readonly "~T": unknown }>);
    expect<TypeArgs<Elem, [any]>>().to(equal<{ readonly "~T": unknown }>);
  });
});
