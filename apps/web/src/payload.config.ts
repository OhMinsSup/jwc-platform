import { configurePayload } from "@jwc/payload/configurePayload";
import { env } from "./env";

export default configurePayload({
	serverURL: env.NEXT_PUBLIC_BACKEND_URL,
});
