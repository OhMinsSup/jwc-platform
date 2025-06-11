import { consoleLoggingIntegration, init } from "@sentry/nextjs";
import { env } from "./env";

export const initializeSentry = (): ReturnType<typeof init> => {
	return init({
		enabled: !!env.NEXT_PUBLIC_SENTRY_DSN,
		dsn: env.NEXT_PUBLIC_SENTRY_DSN,

		// Adds request headers and IP for users, for more info visit:
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
		sendDefaultPii: true,

		// Adjust this value in production, or use tracesSampler for greater control
		tracesSampleRate: 1,

		// Setting this option to true will print useful information to the console while you're setting up Sentry.
		debug: false,

		_experiments: { enableLogs: true },

		integrations: [consoleLoggingIntegration({ levels: ["error"] })],
	});
};
