import { equal, expect, test } from "typroof";

import type { Apply, Identity } from "../src";

test("Identity", () => {
  expect<Apply<Identity, [42]>>().to(equal<42>);
});
