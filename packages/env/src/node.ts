import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const node = () =>
	createEnv({
		server: {
			NODE_ENV: z
				.enum(["development", "production", "test"])
				.default("development"),
			AES_KEY: z.string().min(32),
		},
		runtimeEnv: {
			NODE_ENV: process.env.NODE_ENV,
			AES_KEY: process.env.AES_KEY,
		},
	});
