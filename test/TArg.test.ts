import { describe, equal, expect, it } from "typroof";

import type { Param0, TArg, TypeLambdaG } from "../src";

describe("TArg", () => {
  interface Example extends TypeLambdaG<[["T", string]]> {
    signature: (x: TArg<this, "T">) => void;
    return: void;
  }

  it("should access the type argument passed to a TypeLambdaG if it satisfies the constraint", () => {
    expect<Param0<Example & { "~T": "hello" }>>().to(equal<"hello">);
    expect<Param0<Example & { "~T": string }>>().to(equal<string>);
  });

  it("should cast to the constraint type if the type argument does not satisfy the constraint", () => {
    expect<Param0<Example & { "~T": number }>>().to(equal<string>);
  });
});
