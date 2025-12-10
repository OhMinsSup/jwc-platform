import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4";
import { convex } from "./convex";
import { google } from "./google";
import { skipValidation } from "./helpers/skipValidation";
import { node as nodeEnv } from "./node";
import { sentry } from "./sentry";

export const app = () =>
	createEnv({
		extends: [nodeEnv(), vercel(), sentry(), google(), convex()],
		client: {
			NEXT_PUBLIC_PAID_ACCOUNT_NUMBER: z.string(),
		},
		emptyStringAsUndefined: true,
		runtimeEnv: {
			NEXT_PUBLIC_PAID_ACCOUNT_NUMBER:
				process.env.NEXT_PUBLIC_PAID_ACCOUNT_NUMBER,
		},
		skipValidation,
	});
