import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["convex/**/*.ts"],
	clean: true,
	treeshake: true,
	sourcemap: true,
});
