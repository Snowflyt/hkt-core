import { describe, equal, expect } from "typroof";

import type { ApplyW, Args, TypeLambda } from "../src";

describe("Args", () => {
  interface PrintArgs extends TypeLambda<[a: string, b: string], string> {
    return: Args<this>;
  }

  // Incompatible arguments are cast to `never`
  expect<ApplyW<PrintArgs, ["foo", 42]>>().to(equal<["foo", never]>);
  // Redundant arguments are truncated
  expect<ApplyW<PrintArgs, ["foo", "bar", "baz"]>>().to(equal<["foo", "bar"]>);
  // Missing arguments are filled with `never`
  expect<ApplyW<PrintArgs, ["foo"]>>().to(equal<["foo", never]>);
});
