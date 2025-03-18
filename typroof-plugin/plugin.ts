import chalk from "chalk";
import type { Plugin } from "typroof/plugin";

/**
 * The hkt-core plugin for Typroof.
 * @returns
 */
const hktCore = (): Plugin => ({
  name: "typroof-plugin-hkt-core",

  analyzers: {
    beOfSig(actual, expected, { not, validationResult }) {
      const actualText = chalk.bold(actual.text);
      const actualSignature = chalk.bold(validationResult!.getTupleElements()[0]!.getText());
      const expectedSignature = chalk.bold(expected.getText());

      if (
        validationResult!.getTupleElements()[0]!.getText() !==
        validationResult!.getTupleElements()[1]!.getText()
      )
        if (not)
          throw `Expect TypeLambda ${actualText} not to be of signature ${expectedSignature}, but does.`;
        else
          throw `Expect TypeLambda ${actualText} to be of signature ${expectedSignature}, but got ${chalk.bold(
            actualSignature,
          )}.`;
    },

    beOneOf(actual, expected, { not }) {
      const actualText = chalk.bold(actual.text);
      const expectedTypes = chalk.bold(expected.getText().slice(1, -1));

      throw `Expect type ${actualText} ${not ? "not " : ""}to be one of ${expectedTypes}, but is${
        not ? "" : " not"
      }.`;
    },

    exactEqual(actual, expected, { not }) {
      if (actual.type.getText() === expected.getText()) return;

      const actualText = chalk.bold(actual.text);
      const expectedType = chalk.bold(expected.getText());

      let message = `Expect ${actualText}`;
      if (actual.text !== actual.type.getText())
        message += ` (${chalk.bold(actual.type.getText())})`;
      if (not) message += " not";
      message += ` to exactly equal ${expectedType}, but does`;
      if (!not) message += " not";
      message += ".";

      throw message;
    },
  },
});

export default hktCore;
