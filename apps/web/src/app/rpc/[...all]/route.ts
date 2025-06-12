import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { BatchHandlerPlugin } from "@orpc/server/plugins";
import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "~/api";

import config from "~/payload.config";

const handler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
	plugins: [new BatchHandlerPlugin()],
});

async function handleRequest(req: NextRequest) {
	const { response } = await handler.handle(req, {
		prefix: "/rpc",
		context: await createORPCContext({
			headers: req.headers,
			payloadConfig: config,
		}),
	});

	return response ?? new Response("Not found", { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
