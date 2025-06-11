import { fileURLToPath } from "node:url";
import { withSentry } from "@jwc/observability/next-config";
import { withPayload } from "@payloadcms/next/withPayload";
import createJiti from "jiti";
import type { NextConfig } from "next";

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
createJiti(fileURLToPath(import.meta.url))("./src/env");

const config: NextConfig = {
	/** Enables hot reloading for local packages without a build step */
	transpilePackages: [
		"@jwc/payload",
		"@jwc/env",
		"@jwc/schema",
		"@jwc/api",
		"@jwc/ui",
		"@jwc/utils",
		"@sentry/nextjs",
	],

	/** We already do linting and typechecking as separate tasks in CI */
	eslint: { ignoreDuringBuilds: true },
	typescript: { ignoreBuildErrors: true },
};

let nextConfig: NextConfig = withPayload(config, {
	devBundleServerPackages: false,
});

if (
	process.env.NODE_ENV === "production" &&
	process.env.NEXT_PUBLIC_SENTRY_DSN
) {
	nextConfig = withSentry(nextConfig);
}

export default nextConfig;
