/*
 * This file configures the initialization of Sentry on the client.
 * The config you add here will be used whenever a users loads a page in their browser.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

export const initializeSentry = (): ReturnType<typeof Sentry.init> => {
	return Sentry.init({
		enabled:
			process.env.NEXT_PUBLIC_SENTRY_DSN !== undefined &&
			process.env.NODE_ENV === "production",
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

		// Adds request headers and IP for users, for more info visit:
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
		sendDefaultPii: true,
		// Note: if you want to override the automatic release value, do not set a
		// `release` value here - use the environment variable `SENTRY_RELEASE`, so
		// that it will also get attached to your source maps
		// Adjust this value in production, or use tracesSampler for greater control
		tracesSampleRate: 1,

		// Setting this option to true will print useful information to the console while you're setting up Sentry.
		debug: false,

		replaysOnErrorSampleRate: 1.0,

		// You can remove this option if you're not planning to use the Sentry Session Replay feature:
		integrations: [
			Sentry.replayIntegration({
				// Additional Replay configuration goes in here, for example:
				maskAllText: true,
				blockAllMedia: true,
			}),
			Sentry.consoleLoggingIntegration({ levels: ["error"] }),
		],

		_experiments: { enableLogs: true },
	});
};
