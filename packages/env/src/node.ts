import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

interface NodeServerEnv {
	NODE_ENV: "development" | "production" | "test";
	DATABASE_ENGINE: "postgres";
	DATABASE_URL: string;
	GOOGLE_CLIENT_EMAIL: string;
	GOOGLE_PRIVATE_KEY: string;
	AES_KEY: string;
}

export const node = (): Readonly<NodeServerEnv> =>
	createEnv({
		server: {
			NODE_ENV: z
				.enum(["development", "production", "test"])
				.default("development"),
			DATABASE_ENGINE: z.enum(["postgres"]).default("postgres"),
			DATABASE_URL: z.string().url(),
			GOOGLE_CLIENT_EMAIL: z.string().min(1),
			GOOGLE_PRIVATE_KEY: z.string().min(1),
			AES_KEY: z.string().min(1),
		},
		// @ts-expect-error someting....
		runtimeEnv: process.env,
	});
