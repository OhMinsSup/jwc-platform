import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/date/index.ts",
		"src/format/index.ts",
		"src/options/index.ts",
	],
	dts: true,
	clean: true,
	treeshake: true,
	sourcemap: true,
});
