import { describe, equal, expect, it } from "typroof";

import type { Param0, RawTArg, TypeLambdaG } from "../src";

describe("RawTArg", () => {
  interface Example extends TypeLambdaG<[["T", string]]> {
    signature: (x: RawTArg<this, "T">) => void;
    return: void;
  }

  it("should access the type argument passed to a TypeLambdaG no matter its constraint", () => {
    expect<Param0<Example & { "~T": "hello" }>>().to(equal<"hello">);
    expect<Param0<Example & { "~T": string }>>().to(equal<string>);

    expect<Param0<Example & { "~T": number }>>().to(equal<number>);
  });
});
