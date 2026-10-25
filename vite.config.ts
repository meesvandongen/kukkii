import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    platform: "neutral",
    target: "es2022",
    // The package has no "type" field, so ESM output needs the .mjs extension.
    fixedExtension: true,
    dts: true,
    sourcemap: true,
    publint: true,
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
  // Mirrors the previous .prettierrc (Prettier defaults + trailing commas).
  fmt: {
    ignorePatterns: ["dist/**", "CHANGELOG.md"],
    printWidth: 80,
    trailingComma: "all",
    sortPackageJson: false,
  },
  lint: {
    ignorePatterns: ["dist/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    // typeCheck is off: it checks with TypeScript 7's lib types, where the
    // Uint8Array/BufferSource usage that the pinned TypeScript 5.4 accepts fails.
    options: { typeAware: true, typeCheck: false },
  },
});
