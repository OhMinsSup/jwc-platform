import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";
import { skipValidation } from "./helpers/skipValidation";
import { node as nodeEnv } from "./node";
import { payload as payloadEnv } from "./payload";

const isProduction = process.env.NODE_ENV === "production";

export const app = () =>
	createEnv({
		extends: [payloadEnv(), nodeEnv(), vercel()],
		client: {
			NEXT_PUBLIC_PAID_ACCOUNT_NUMBER: z.string(),
			NEXT_PUBLIC_SENTRY_DSN: isProduction
				? z.string().min(1)
				: z.string().optional(),
		},
		emptyStringAsUndefined: true,
		runtimeEnv: {
			NEXT_PUBLIC_PAID_ACCOUNT_NUMBER:
				process.env.NEXT_PUBLIC_PAID_ACCOUNT_NUMBER,
			NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
		},
		skipValidation,
	});
