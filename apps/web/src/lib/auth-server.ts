import { setupFetchClient } from "@convex-dev/better-auth/react-start";
import { createAuth } from "@jwc/backend/convex/auth";
import { getCookie } from "@tanstack/react-start/server";

// These helpers call Convex functions using a token from
// Better Auth's cookies, if available.
export const { fetchQuery, fetchMutation, fetchAction } =
	await setupFetchClient(createAuth, getCookie);
