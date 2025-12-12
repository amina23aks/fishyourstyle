import { FlatCompat } from "@eslint/eslintrc";
import nextPlugin from "@next/eslint-plugin-next";
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";
import reactHooks from "eslint-plugin-react-hooks";

const compat = new FlatCompat({ baseDirectory: new URL(".", import.meta.url).pathname });

const eslintConfig = [
  {
    name: "next-plugin",
    plugins: { "@next/next": nextPlugin, "react-hooks": reactHooks },
  },
  ...compat.extends(...(nextVitals?.extends ?? [])),
  ...compat.extends(...(nextTs?.extends ?? [])),
  {
    name: "custom-ignores",
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
