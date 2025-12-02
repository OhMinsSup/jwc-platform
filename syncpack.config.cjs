"use strict";
/** @type {import("syncpack").RcFile} */
module.exports = {
	dependencyTypes: ["prod", "dev"],
	lintFormatting: false,
	semverGroups: [
		{
			packages: ["**"],
			dependencies: ["**"],
			range: "^",
		},
		{
			dependencies: [
				"@sentry/nextjs",
				"@orpc/client",
				"@tanstack/react-query",
				"@orpc/openapi",
				"@orpc/react",
				"@orpc/react-query",
				"@orpc/server",
				"@orpc/zod",
				"@payloadcms/db-postgres",
				"@payloadcms/live-preview-react",
				"@payloadcms/next",
				"@payloadcms/plugin-sentry",
				"@payloadcms/richtext-lexical",
				"@payloadcms/ui",
				"@types/react",
				"@types/react-dom",
				"react",
				"react-dom",
				"payload",
				"zod",
				"next",
				"typescript",
				"tailwindcss",
				"postcss",
				"autoprefixer",
				"tsup",
			],
			isIgnored: true,
		},
	],
};
