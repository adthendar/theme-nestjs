import tseslint from "typescript-eslint";
export default tseslint.config(
  {
    ignores: [
      "**/generated/**",
      "**/dist/**",
      "**/.next/**",
      "**/.next-e2e/**",
      "**/next-env.d.ts",
    ],
  },
  ...tseslint.configs.recommended,
);
