// @ts-check

module.exports = /** @satisfies {import("prettier").Config} */ ({
  arrowParens: "always",
  bracketSameLine: true,
  bracketSpacing: true,
  experimentalTernaries: true,
  plugins: ["prettier-plugin-packagejson"],
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
});
