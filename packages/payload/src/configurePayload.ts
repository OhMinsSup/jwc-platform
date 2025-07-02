import path from "node:path";
import { fileURLToPath } from "node:url";
import { Forms } from "@jwc/payload/collections/Forms";
import { Users } from "@jwc/payload/collections/Users";
import { syncGoogleSheetEndpoints } from "@jwc/payload/endpoints/syncGoogleSheet.endpoints";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sentryPlugin } from "@payloadcms/plugin-sentry";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import * as Sentry from "@sentry/nextjs";
import type { Config } from "payload";
import { buildConfig, deepMerge } from "payload";
import { en } from "payload/i18n/en";
import { ko } from "payload/i18n/ko";
import { env } from "./env";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const baseConfig: Config = {
	admin: {
		user: Users.slug,
		importMap: {
			baseDir: path.resolve(dirname),
		},
	},
	collections: [Users, Forms],
	typescript: {
		outputFile: path.resolve(dirname, "payload.types.ts"),
		declare: false,
	},
	db: postgresAdapter({
		pool: {
			connectionString: env.DATABASE_URL,
		},
		migrationDir: path.resolve(dirname, "migrations"),
	}),
	editor: lexicalEditor(),
	i18n: {
		supportedLanguages: { en, ko },
	},
	plugins: [
		sentryPlugin({
			Sentry,
		}),
	],
	secret: env.PAYLOAD_PRIVATE_SECRET,
	endpoints: [
		{
			path: "/webhooks/google-sheet",
			method: "post",
			handler: syncGoogleSheetEndpoints,
		},
	],
};

export const configurePayload = (overrides?: Partial<Config>) => {
	return buildConfig(deepMerge(baseConfig, overrides ?? {}));
};
