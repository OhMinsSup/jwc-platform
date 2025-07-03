import { prisma } from "@jwc/database";
import type { BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";
import { env } from "./env";

export const authConfig = {
	appName: "Jwc",
	baseURL: `${env.NEXT_PUBLIC_API_URL}/api/v1/auth`,
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
	emailAndPassword: {
		enabled: true,
	},
	plugins: [openAPI()],
} satisfies BetterAuthOptions;
