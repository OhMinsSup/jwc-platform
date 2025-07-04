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

		// Adjust this value in production, or use tracesSampler for greater control
		tracesSampleRate: 1,

		// Setting this option to true will print useful information to the console while you're setting up Sentry.
		debug: false,

		_experiments: { enableLogs: true },

		integrations: [Sentry.consoleLoggingIntegration({ levels: ["error"] })],
	});
};
