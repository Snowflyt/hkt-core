import { beOfSig } from "@hkt-core/typroof-plugin";
import { describe, equal, expect, it } from "typroof";

import type { Arg0, Arg1, Call1W, Sig, TArg, TypeLambda, TypeLambdaG } from "../src";

describe("Sig", () => {
  it("should infer the signature of a non-generic type-level function", () => {
    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      return: `${Arg0<this>}${Arg1<this>}`;
    }

    expect<Sig<Concat>>().to(equal<(s1: string, s2: string) => string>);
    expect<Concat>().to(beOfSig<(s1: string, s2: string) => string>);
  });

  it("should infer the signature of a generic type-level function with one type parameter", () => {
    interface MakeTuple extends TypeLambdaG<["T"]> {
      signature: (value: TArg<this, "T">) => [TArg<this, "T">];
      return: [Arg0<this>];
    }

    expect<Sig<MakeTuple>>().to(equal<<T>(value: T) => [T]>);
    expect<MakeTuple>().to(beOfSig<<T>(value: T) => [T]>);
  });

  it("should infer the signature of a generic type-level function with two type parameters", () => {
    interface Map extends TypeLambdaG<["T", "U"]> {
      signature: (
        f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
        xs: TArg<this, "T">[],
      ) => TArg<this, "U">[];
      return: _Map<Arg0<this>, Arg1<this>>;
    }
    type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

    expect<Sig<Map>>().to(equal<<T, U>(f: (x: T) => U, xs: T[]) => U[]>);
    expect<Map>().to(beOfSig<<T, U>(f: (x: T) => U, xs: T[]) => U[]>);
  });
});
