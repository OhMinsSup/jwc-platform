import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

const isProduction = process.env.NODE_ENV === "production";

export const sentry = () =>
	createEnv({
		client: {
			NEXT_PUBLIC_SENTRY_DSN: isProduction
				? z.string().min(1)
				: z.string().optional(),
		},
		server: {
			// Sentry Env
			SENTRY_AUTH_TOKEN: isProduction
				? z.string().min(1, "Must be a non-empty string")
				: z.string().optional(),
			SENTRY_PROJECT: isProduction
				? z.string().min(1, "Must be a non-empty string")
				: z.string().optional(),
			SENTRY_ORG: isProduction
				? z.string().min(1, "Must be a non-empty string")
				: z.string().optional(),
		},
		emptyStringAsUndefined: true,
		runtimeEnv: {
			// Client
			NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
			// Server
			SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
			SENTRY_PROJECT: process.env.SENTRY_PROJECT,
			SENTRY_ORG: process.env.SENTRY_ORG,
		},
	});
