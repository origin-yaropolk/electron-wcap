// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default defineConfig([{
	extends: compat.extends(
		"eslint-config-standard",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
	),

	plugins: {
		"@typescript-eslint": typescriptEslint,
		"simple-import-sort": simpleImportSort,
	},

	languageOptions: {
		globals: {
			...globals.browser,
			...globals.node,
			...globals.jest,
		},

		parser: tsParser,
		ecmaVersion: 5,
		sourceType: "module",

		parserOptions: {
			project: "./src/tsconfig.json",
		},
		
	},

	rules: {
		"@typescript-eslint/array-type": "off",

		"@typescript-eslint/explicit-function-return-type": ["error", {
			allowExpressions: true,
		}],

		"@typescript-eslint/explicit-member-accessibility": ["off", {
			accessibility: "explicit",
		}],

		"@typescript-eslint/indent": ["off", "tabs"],
		"@typescript-eslint/interface-name-prefix": "off",

		"@typescript-eslint/member-ordering": ["error", {
			default: {
				memberTypes: [
					"static-field",
					"instance-field",
					"abstract-field",
					"static-method",
					"constructor",
					"instance-method",
					"abstract-method",
				],
			},

			interfaces: {
				order: "as-written",
				optionalityOrder: "required-first",
			},
		}],

		"@typescript-eslint/method-signature-style": ["error", "method"],

		"@typescript-eslint/naming-convention": ["error", {
			selector: "variableLike",
			format: ["camelCase", "UPPER_CASE", "PascalCase"],
			leadingUnderscore: "allow",
			trailingUnderscore: "allowSingleOrDouble",
		}, {
			selector: ["memberLike", "property", "method"],
			format: ["camelCase"],
			leadingUnderscore: "forbid",
			trailingUnderscore: "forbid",
		}, {
			selector: "typeLike",
			format: ["PascalCase"],
			leadingUnderscore: "forbid",
			trailingUnderscore: "forbid",
		}, {
			selector: "enumMember",
			format: ["PascalCase", "UPPER_CASE"],
			leadingUnderscore: "forbid",
			trailingUnderscore: "forbid",
		}],

		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-floating-promises": "off",

		"@typescript-eslint/no-magic-numbers": ["error", {
			ignore: [-1, 0, 1, 2, 100],
			ignoreDefaultValues: true,
			ignoreArrayIndexes: true,
			ignoreEnums: true,
			ignoreTypeIndexes: true,
			ignoreReadonlyClassProperties: true,
		}],

		"@typescript-eslint/no-non-null-assertion": "error",
		"@typescript-eslint/no-parameter-properties": "off",
		"@typescript-eslint/no-redundant-type-constituents": "off",
		"@typescript-eslint/no-shadow": ["error"],
		"@typescript-eslint/no-unnecessary-type-arguments": "warn",
		"@typescript-eslint/no-unsafe-declaration-merging": "off",
		"@typescript-eslint/no-unsafe-enum-comparison": "off",
		"@typescript-eslint/no-var-requires": "off",

		"@typescript-eslint/prefer-for-of": "error",
		"@typescript-eslint/prefer-function-type": "error",

		"@typescript-eslint/restrict-template-expressions": ["warn", {
			allowBoolean: true,
		}],

		"@typescript-eslint/triple-slash-reference": ["error", {
			path: "always",
			types: "prefer-import",
			lib: "always",
		}],

		"@typescript-eslint/unbound-method": "off",
		"@typescript-eslint/unified-signatures": "warn",
		"arrow-parens": ["off", "always"],

		"brace-style": ["error", "stroustrup", {
			allowSingleLine: true,
		}],

		camelcase: "error",
		"comma-dangle": "off",

		complexity: "off",
		"constructor-super": "error",
		curly: "error",
		"dot-notation": "error",
		"eol-last": ["error", "always"],
		eqeqeq: ["error", "smart"],
		"guard-for-in": "error",

		"id-blacklist": [
			"error",
			"any",
			"number",
			"String",
			"string",
			"Boolean",
			"boolean",
			"Undefined",
		],

		"id-match": "error",
		"import/order": "off",
		"max-classes-per-file": "off",

		"max-len": ["error", {
			code: 190,
		}],

		"new-parens": "error",
		"no-bitwise": "error",
		"no-caller": "error",
		"no-cond-assign": "error",

		"no-console": ["error", {
			allow: [
				"log",
				"warn",
				"trace",
				"debug",
				"dir",
				"timeLog",
				"assert",
				"clear",
				"count",
				"countReset",
				"group",
				"groupEnd",
				"table",
				"dirxml",
				"error",
				"groupCollapsed",
				"Console",
				"profile",
				"profileEnd",
				"timeStamp",
				"context",
			],
		}],

		"no-debugger": "error",
		"no-empty": "off",
		"no-eval": "error",
		"no-extra-parens": "off",
		"no-extra-semi": "off",
		"no-fallthrough": "error",
		"no-invalid-this": "off",
		"no-magic-numbers": "off",
		"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
		"no-multiple-empty-lines": 1,
		"no-new-wrappers": "error",
		"no-restricted-imports": ["error", "rxjs/Rx"],
		"no-shadow": "off",
		"no-throw-literal": "error",
		"no-trailing-spaces": "error",
		"no-undef-init": "error",
		"no-underscore-dangle": "off",
		"no-unsafe-finally": "error",
		"no-unused-expressions": "error",
		"no-unused-labels": "error",
		"no-unused-vars": "off",
		"object-curly-spacing": "off",
		"object-shorthand": "error",

		"quote-props": ["error", "consistent-as-needed", {
			unnecessary: true,
		}],

		"one-var": ["error", "never"],

		quotes: [2, "single", {
			avoidEscape: true,
		}],

		radix: "error",

		"simple-import-sort/imports": ["error", {
			groups: [["^\\u0000$"], ["\\w+", "@\\w+"], [
				"^(\\.\\.\\/)+.+(?<!\\.svg|webm)$",
				"^\\.\\.$",
				"^\\.\\/.+(?<!\\.svg|webm)$",
				"^\\.$",
			], ["^.+\\.svg$", "^.+\\.webm$"], ["^.+\\.css$"]],
		}],

		"space-infix-ops": "off",

		"spaced-comment": ["error", "always", {
			markers: ["/"],
		}],

		"use-isnan": "error",
		semi: ["error", "always"],

		"keyword-spacing": ["error", {
			after: true,
		}],

		"arrow-spacing": ["error", {
			before: true,
			after: true,
		}],

		"key-spacing": "error",
		"valid-typeof": "off",
		"func-call-spacing": "off",
		"template-curly-spacing": ["error", "always"],
		"no-template-curly-in-string": "off",
		"space-before-function-paren": ["error", "never"],

		"generator-star-spacing": ["error", {
			before: false,
			after: true,

			method: {
				before: true,
				after: false,
			},
		}],

		"no-use-before-define": "off",

		"@typescript-eslint/no-use-before-define": ["error", {
			functions: false,
			classes: false,
			variables: false,
		}],

		"n/no-deprecated-api": "off",
		"n/no-callback-literal": "off",

		"no-void": ["error", {
			allowAsStatement: true,
		}],

		"prefer-promise-reject-errors": "off",

		"promise/param-names": ["error", {
			resolvePattern: "^_?resolve",
		}],

		"@typescript-eslint/no-unused-vars": [
			"error",
			{
			"args": "all",
			"argsIgnorePattern": "^_",
			"caughtErrors": "all",
			"caughtErrorsIgnorePattern": "^_",
			"destructuredArrayIgnorePattern": "^_",
			"varsIgnorePattern": "^_",
			"ignoreRestSiblings": true
			}
		],

		indent: ["error", "tab", {
			SwitchCase: 1,
			ignoredNodes: ["ClassBody.body > PropertyDefinition[decorators.length > 0] > .key"],
		}],

		"no-tabs": "off",
		"no-useless-constructor": "off",
		"no-useless-return": "off",
	},
}]);
