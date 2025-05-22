import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export interface PayloadEnv {
	PAYLOAD_PRIVATE_REVALIDATION_KEY: string;
	PAYLOAD_PRIVATE_SECRET: string;
}

export const payload = (): Readonly<PayloadEnv> =>
	createEnv({
		server: {
			PAYLOAD_PRIVATE_REVALIDATION_KEY: z.string(),
			PAYLOAD_PRIVATE_SECRET: z.string(),
		},
		// @ts-expect-error someting....
		runtimeEnv: process.env,
	});
