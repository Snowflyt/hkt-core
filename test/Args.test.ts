import { describe, equal, expect, it } from "typroof";

import type { ApplyW, Args, TypeLambda } from "../src";

describe("Args", () => {
  interface PrintArgs extends TypeLambda<[a: string, b: string], string> {
    return: Args<this>;
  }

  it("should cast incompatible arguments to `never`", () => {
    expect<ApplyW<PrintArgs, ["foo", 42]>>().to(equal<["foo", never]>);
    expect<ApplyW<PrintArgs, [42, "foo"]>>().to(equal<[never, "foo"]>);
  });

  it("should truncate redundant arguments", () => {
    expect<ApplyW<PrintArgs, ["foo", "bar", "baz"]>>().to(equal<["foo", "bar"]>);
  });

  it("should fill missing arguments with `never`", () => {
    expect<ApplyW<PrintArgs, ["foo"]>>().to(equal<["foo", never]>);
  });

  it("should follow all three rules at the same time", () => {
    expect<ApplyW<PrintArgs, [42, "foo", 42]>>().to(equal<[never, "foo"]>);
    expect<ApplyW<PrintArgs, [42]>>().to(equal<[never, never]>);
  });
});
