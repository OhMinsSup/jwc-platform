/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the oRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { os } from "@orpc/server";
import type { SanitizedConfig } from "payload";

import { $auth } from "~/api/middlewares/auth";
import { $payload } from "~/api/middlewares/payload";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a oRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://orpc.unnoq.com/docs/context
 */
export const createORPCContext = async (opts: {
	headers: Headers;
	payloadConfig: SanitizedConfig | Promise<SanitizedConfig>;
	// eslint-disable-next-line @typescript-eslint/require-await
}) => opts;

export type ORPCCOntextType = Awaited<ReturnType<typeof createORPCContext>>;

/**
 * 2. INITIALIZATION
 *
 * This is where the oRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const o = os.$context<ORPCCOntextType>();

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your oRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your oRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const pub = o.use($payload);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `context.session.user` is not null.
 *
 * @see https://orpc.unnoq.com/docs/procedure
 */
export const authed = pub.use($auth);
