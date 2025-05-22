import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";
import { skipValidation } from "./helpers/skipValidation";
import { node as nodeEnv } from "./node";
import { payload as payloadEnv } from "./payload";

export const app = () =>
	createEnv({
		extends: [payloadEnv(), nodeEnv(), vercel()],
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
