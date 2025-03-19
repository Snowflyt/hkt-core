import type * as ts from "typescript";
import type { Plugin } from "typroof/plugin";
import { bold } from "typroof/utils/colors";

/**
 * The hkt-core plugin for Typroof.
 * @returns
 */
const hktCore = (): Plugin => ({
  name: "typroof-plugin-hkt-core",

  analyzers: {
    beOfSig(actual, expected, { not, typeChecker, validationResult }) {
      const actualText = bold(actual.text);
      const expectedSignature = bold(typeChecker.typeToString(expected));

      if (!validationResult)
        if (not)
          throw `Expect TypeLambda ${actualText} not to be of signature ${expectedSignature}, but does.`;
        else
          throw `Expect TypeLambda ${actualText} to be of signature ${expectedSignature}, but does not.`;

      const tupleTypes = typeChecker.getTypeArguments(validationResult as ts.TupleType);
      const actualSignature = bold(typeChecker.typeToString(tupleTypes[0]!));

      if (typeChecker.typeToString(tupleTypes[0]!) !== typeChecker.typeToString(tupleTypes[1]!))
        if (not)
          throw `Expect TypeLambda ${actualText} not to be of signature ${expectedSignature}, but does.`;
        else
          throw `Expect TypeLambda ${actualText} to be of signature ${expectedSignature}, but got ${bold(
            actualSignature,
          )}.`;
    },

    beOneOf(actual, expected, { not, typeChecker }) {
      const actualText = bold(actual.text);
      const expectedTypes = bold(typeChecker.typeToString(expected).slice(1, -1));

      throw `Expect type ${actualText} ${not ? "not " : ""}to be one of ${expectedTypes}, but is${
        not ? "" : " not"
      }.`;
    },

    exactEqual(actual, expected, { not, typeChecker }) {
      if (typeChecker.typeToString(actual.type) === typeChecker.typeToString(expected)) return;

      const actualText = bold(actual.text);
      const expectedType = bold(typeChecker.typeToString(expected));

      let message = `Expect ${actualText}`;
      if (actual.text !== typeChecker.typeToString(actual.type))
        message += ` (${bold(typeChecker.typeToString(actual.type))})`;
      if (not) message += " not";
      message += ` to exactly equal ${expectedType}, but does`;
      if (!not) message += " not";
      message += ".";

      throw message;
    },
  },
});

export default hktCore;
