import { configurePayload } from "@jwc/payload/configurePayload";
import { env } from "./env";

export default configurePayload({
	cors: [env.NEXT_PUBLIC_BACKEND_URL, env.NEXT_PUBLIC_FORM_APP_URL],
});
