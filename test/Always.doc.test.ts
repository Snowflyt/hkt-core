import { beOfSig } from "@hkt-core/typroof-plugin";
import { equal, expect, test } from "typroof";

import type { Always, Apply } from "../src";

test("Always", () => {
  type Always42 = Always<42>;

  expect<Always42>().to(beOfSig<() => 42>);
  expect<Apply<Always42, []>>().to(equal<42>);
});
