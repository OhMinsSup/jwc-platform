import { withSentryConfig } from "@sentry/nextjs";
import { env } from "./env";

export const sentryConfig: Parameters<typeof withSentryConfig>[1] = {
	org: env.SENTRY_ORG,
	project: env.SENTRY_PROJECT,

	// Only print logs for uploading source maps in CI
	silent: !env.CI,

	/*
	 * For all available options, see:
	 * https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
	 */

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	/*
	 * Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	 * This can increase your server load as well as your hosting bill.
	 * Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	 * side errors will fail.
	 */
	tunnelRoute: "/monitoring",

	// Automatically tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,

	reactComponentAnnotation: {
		enabled: true,
	},
};

export const withSentry = (sourceConfig: object): object => {
	const configWithTranspile = {
		...sourceConfig,
		transpilePackages: ["@sentry/nextjs"],
	};

	return withSentryConfig(configWithTranspile, sentryConfig);
};
