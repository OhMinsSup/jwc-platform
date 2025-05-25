import path from "node:path";
import { fileURLToPath } from "node:url";
import { Forms } from "@jwc/payload/collections/Forms";
import { Users } from "@jwc/payload/collections/Users";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sentryPlugin } from "@payloadcms/plugin-sentry";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import * as Sentry from "@sentry/nextjs";
import type { Config, TaskConfig } from "payload";
import { buildConfig, deepMerge } from "payload";

import { en } from "payload/i18n/en";
import { ko } from "payload/i18n/ko";
import { env } from "./env";
import { syncGoogleSpreadsheet } from "./helpers/google";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const AES_KEY = Buffer.from(env.AES_KEY, "base64");

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
	editor: lexicalEditor({}),
	i18n: {
		supportedLanguages: { en, ko },
	},
	plugins: [
		sentryPlugin({
			Sentry,
		}),
	],
	jobs: {
		tasks: [
			{
				// This is a unique identifier for the task
				slug: "syncGoogleSheet",
				outputSchema: [
					{
						name: "success",
						type: "checkbox",
					},
					{
						name: "message",
						type: "text",
					},
				],
				// These are the properties that the function should output
				handler: async ({ req }) => {
					try {
						const { docs } = await req.payload.find({
							collection: "forms",
							limit: 100,
						});

						console.log("Found documents:", docs);

						if (docs && docs.length > 0) {
							const sheet = await syncGoogleSpreadsheet(docs);
							console.log("Google Sheet updated successfully:", sheet.sheetId);
						}

						return {
							output: {
								success: true,
								message: "Google Sheet sync completed successfully.",
							},
						};
					} catch (error) {
						req.payload.logger.error("[job task]: google sheet sync", error);
						return {
							output: {
								success: false,
								message: "Failed to sync Google Sheet.",
							},
						};
					}
				},
			} as TaskConfig<"syncGoogleSheet">,
		],
	},
	secret: env.PAYLOAD_PRIVATE_SECRET,
};

export const configurePayload = (overrides?: Partial<Config>) => {
	return buildConfig(deepMerge(baseConfig, overrides ?? {}));
};
