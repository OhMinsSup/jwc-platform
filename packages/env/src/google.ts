import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const google = () =>
	createEnv({
		server: {
			GOOGLE_CLIENT_EMAIL: z.string().min(1),
			GOOGLE_PRIVATE_KEY: z
				.string()
				.min(1)
				.transform((str) => str.split("\\n").join("\n")),
			// Google Env
			GOOGLE_SHEET_ID: z.string().min(1),
			GOOGLE_SHEET_TITLE: z.string().min(1),
		},
		runtimeEnv: {
			GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
			GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
			GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
			GOOGLE_SHEET_TITLE: process.env.GOOGLE_SHEET_TITLE,
		},
	});
