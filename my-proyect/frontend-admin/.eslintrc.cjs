/**
 * ESLint config for frontend-admin/.
 *
 * Ref: tasks.md T003 — hacer cumplir la separación de capas (Principio III de la
 * constitución `.specify/memory/constitution.md`): presentación / dominio / aplicación /
 * infraestructura. En particular, prohíbe imports de `fetch`/`axios` fuera de
 * `src/infrastructure/`, ya que solo esa capa puede realizar llamadas HTTP directas.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  settings: {
    react: { version: "detect" },
  },
  ignorePatterns: ["dist", "build", "node_modules", "coverage"],
  rules: {
    // Principio III (NON-NEGOTIABLE): solo src/infrastructure/ puede hacer llamadas HTTP.
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "axios",
            message:
              "Prohibido: 'axios' solo puede importarse dentro de 'src/infrastructure/' (Principio III de la constitución).",
          },
        ],
      },
    ],
    "no-restricted-globals": [
      "error",
      {
        name: "fetch",
        message:
          "Prohibido: 'fetch' solo puede usarse dentro de 'src/infrastructure/' (Principio III de la constitución).",
      },
    ],
    "react/react-in-jsx-scope": "off",
  },
  overrides: [
    {
      // La capa de infraestructura es la única autorizada a usar fetch/axios directamente.
      files: ["src/infrastructure/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": "off",
        "no-restricted-globals": "off",
      },
    },
    {
      files: ["tests/**/*.{ts,tsx}"],
      env: { jest: true },
    },
  ],
};
