import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const node = () =>
	createEnv({
		server: {
			NODE_ENV: z
				.enum(["development", "production", "test"])
				.default("development"),
			ENCRYPTION_KEY: z.string().min(32),
		},
		runtimeEnv: {
			NODE_ENV: process.env.NODE_ENV,
			ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
		},
	});
