import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    styles: "src/styles.css",
  },
  format: ["esm", "cjs"],
  dts: { entry: ["src/index.ts"] },
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@particle-academy/react-fancy",
    "@particle-academy/fancy-echarts",
    "@particle-academy/fancy-code",
    "@particle-academy/fancy-screens",
  ],
  treeshake: true,
});
