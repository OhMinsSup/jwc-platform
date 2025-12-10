import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["convex/**/*.ts"],
	dts: true,
	clean: true,
	treeshake: true,
	sourcemap: true,
});
