import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";
import { skipValidation } from "./helpers/skipValidation";

export const solapi = () =>
	createEnv({
		server: {
			/** Solapi API Key */
			SOLAPI_API_KEY: z.string().min(1),
			/** Solapi API Secret */
			SOLAPI_API_SECRET: z.string().min(1),
			/** 발신번호 (사전 등록 필요) */
			SOLAPI_SENDER_PHONE: z.string().min(1),
		},
		emptyStringAsUndefined: true,
		runtimeEnv: {
			SOLAPI_API_KEY: process.env.SOLAPI_API_KEY,
			SOLAPI_API_SECRET: process.env.SOLAPI_API_SECRET,
			SOLAPI_SENDER_PHONE: process.env.SOLAPI_SENDER_PHONE,
		},
		skipValidation,
	});
