import { configurePayload } from "@jwc/payload/configurePayload";
import { sentryPlugin } from "@payloadcms/plugin-sentry";
import * as Sentry from "@sentry/nextjs";

export default configurePayload({
	plugins: [
		sentryPlugin({
			Sentry,
		}),
	],
});
