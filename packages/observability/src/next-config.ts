import { withSentryConfig } from "@sentry/nextjs";

export const sentryConfig: Parameters<typeof withSentryConfig>[1] = {
	org: process.env.SENTRY_ORG,
	project: process.env.SENTRY_PROJECT,

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	/*
	//  * For all available options, see:
	//  * https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
	//  */

	// // Upload a larger set of source maps for prettier stack traces (increases build time)
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

	sourcemaps: {
		disable: true,
	},

	reactComponentAnnotation: {
		enabled: true,
	},
};

export const withSentry = (sourceConfig: object): object => {
	const configWithTranspile = {
		...sourceConfig,
	};

	return withSentryConfig(configWithTranspile, sentryConfig);
};
