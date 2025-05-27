import * as Sentry from "@sentry/nextjs";

Sentry.init({
	enabled:
		process.env.NODE_ENV === "production" &&
		!!process.env.NEXT_PUBLIC_SENTRY_DSN,
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

	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate: 0.1,

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

// This export will instrument router navigations, and is only relevant if you enable tracing.
// `captureRouterTransitionStart` is available from SDK version 9.12.0 onwards
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
