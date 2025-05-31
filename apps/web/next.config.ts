import { fileURLToPath } from "node:url";
import { withPayload } from "@payloadcms/next/withPayload";
import { withSentryConfig } from "@sentry/nextjs";
import createJiti from "jiti";
import type { NextConfig } from "next";

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
createJiti(fileURLToPath(import.meta.url))("./src/env");

const nextConfig: NextConfig = {
	/** Enables hot reloading for local packages without a build step */
	transpilePackages: [
		"@jwc/payload",
		"@jwc/env",
		"@jwc/schema",
		"@jwc/api",
		"@jwc/ui",
		"@jwc/utils",
	],

	/** We already do linting and typechecking as separate tasks in CI */
	eslint: { ignoreDuringBuilds: true },
	typescript: { ignoreBuildErrors: true },
};

export default withSentryConfig(
	withPayload(nextConfig, { devBundleServerPackages: false }),
	{
		org: process.env.SENTRY_ORG,
		project: process.env.SENTRY_PROJECT,

		tunnelRoute: "/monitoring",

		reactComponentAnnotation: {
			enabled: true,
		},
	}
);
