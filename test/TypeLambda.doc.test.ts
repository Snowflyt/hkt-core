import { describe, equal, error, expect, it } from "typroof";

import { beOfSig } from "@hkt-core/typroof-plugin";

import type { Apply, Arg0, Arg1, TypeLambda } from "../src";

describe("TypeLambda", () => {
  it("should create a TypeLambda that concatenates two strings", () => {
    interface Concat extends TypeLambda<[s1: string, s2: string], string> {
      return: `${Arg0<this>}${Arg1<this>}`;
    }

    expect<Concat>().to(beOfSig<(s1: string, s2: string) => string>);

    expect<Apply<Concat, ["foo", "bar"]>>().not.to(error);
    expect<Apply<Concat, ["foo", "bar"]>>().to(equal<"foobar">);

    // @ts-expect-error
    expect<Apply<Concat, ["foo", 42]>>().to(error);
  });

  it("should create a TypeLambda that joins an array of strings with a separator", () => {
    interface JoinBy<Sep extends string> extends TypeLambda<[strings: string[]], string> {
      return: Arg0<this> extends [infer S extends string] ? S
      : Arg0<this> extends [infer Head extends string, ...infer Tail extends string[]] ?
        `${Head}${Sep}${Apply<JoinBy<Sep>, [Tail]>}`
      : "";
    }

    expect<JoinBy<", ">>().not.to(error);
    expect<JoinBy<", ">>().to(beOfSig<(strings: string[]) => string>);

    expect<Apply<JoinBy<", ">, [["foo", "bar", "baz"]]>>().not.to(error);
    expect<Apply<JoinBy<", ">, [["foo", "bar", "baz"]]>>().to(equal<"foo, bar, baz">);
  });

  it("should create an untyped version of `Concat`", () => {
    interface JustConcat extends TypeLambda {
      return: `${Arg0<this>}${Arg1<this>}`;
    }

    expect<Apply<JustConcat, ["foo", "bar"]>>().not.to(error);
    expect<Apply<JustConcat, ["foo", "bar"]>>().to(equal<"foobar">);

    expect<Apply<JustConcat, ["foo", 42]>>().not.to(error);
    expect<Apply<JustConcat, ["foo", 42]>>().to(equal<"foo42">);
  });
});
