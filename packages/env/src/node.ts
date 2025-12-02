import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const node = () =>
	createEnv({
		server: {
			NODE_ENV: z
				.enum(["development", "production", "test"])
				.default("development"),
		},
		runtimeEnv: {
			NODE_ENV: process.env.NODE_ENV,
		},
	});
