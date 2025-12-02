import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";
import { skipValidation } from "./helpers/skipValidation";

export const convex = () =>
	createEnv({
		server: {
			CONVEX_DEPLOYMENT: z.string().optional(),
			CONVEX_URL: z.url(),
		},
		client: {
			NEXT_PUBLIC_SITE_URL: z.url(),
		},
		emptyStringAsUndefined: true,
		runtimeEnv: {
			CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
			CONVEX_URL: process.env.CONVEX_URL,
			NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
		},
		skipValidation,
	});
