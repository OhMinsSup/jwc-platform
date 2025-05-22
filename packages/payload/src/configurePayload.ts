import path from "node:path";
import { fileURLToPath } from "node:url";
import { Forms } from "@jwc/payload/collections/Forms";
import { Users } from "@jwc/payload/collections/Users";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { Config } from "payload";
import { buildConfig, deepMerge } from "payload";

import { en } from "payload/i18n/en";
import { ko } from "payload/i18n/ko";
import { env } from "./env";

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
	plugins: [],
	secret: env.PAYLOAD_PRIVATE_SECRET,
};

export const configurePayload = (overrides?: Partial<Config>) => {
	return buildConfig(deepMerge(baseConfig, overrides ?? {}));
};
