import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/date/index.ts",
		"src/format/index.ts",
		"src/options/index.ts",
		"src/crypto/index.ts",
	],
	dts: true,
	clean: true,
	treeshake: true,
	sourcemap: true,
});
