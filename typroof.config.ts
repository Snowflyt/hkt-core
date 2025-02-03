import hktCore from "@hkt-core/typroof-plugin";
import { defineConfig } from "typroof/config";

export default defineConfig({
  testFiles: "test/**/*.test.ts",
  plugins: [hktCore()],
});
