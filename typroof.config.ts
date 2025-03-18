import { defineConfig } from "typroof/config";

import hktCore from "@hkt-core/typroof-plugin";

export default defineConfig({
  testFiles: "test/**/*.test.ts",
  plugins: [hktCore()],
});
