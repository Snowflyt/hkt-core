import { describe, equal, expect, it } from "typroof";

import type { Arg0, Arg1, RetType, TypeLambda } from "../src";

describe("RetType", () => {
  interface Concat extends TypeLambda<[s1: string, s2: string], string> {
    return: `${Arg0<this>}${Arg1<this>}`;
  }

  it("should get the return type of a type-level function", () => {
    expect<RetType<Concat>>().to(equal<string>);
  });

  it("should handle type-level functions with `never` parameters", () => {
    expect<RetType<TypeLambda<[n: never], string>>>().to(equal<string>);
    expect<RetType<TypeLambda<[n: never], number>>>().to(equal<number>);
  });
});
