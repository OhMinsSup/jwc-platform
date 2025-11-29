import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/app.ts", "src/node.ts", "src/payload.ts"],
	dts: true,
	clean: true,
	treeshake: true,
	sourcemap: true,
});
