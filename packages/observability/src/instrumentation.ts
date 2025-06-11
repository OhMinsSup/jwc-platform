import {
	captureRequestError,
	consoleLoggingIntegration,
	init,
} from "@sentry/nextjs";
import { env } from "./env";

const opts = {
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
};

export const initializeSentry = () => {
	if (process.env.NEXT_RUNTIME === "nodejs" && env.NODE_ENV === "production") {
		init(opts);
	}

	if (process.env.NEXT_RUNTIME === "edge" && env.NODE_ENV === "production") {
		init(opts);
	}
};

export const onRequestErrorSentry = (
	...args: Parameters<typeof captureRequestError>
) => {
	return captureRequestError(...args);
};
