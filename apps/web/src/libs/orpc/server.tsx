"server only";

import { appRouter, createORPCContext } from "@jwc/api";
import type { QueryOptionsBase } from "@orpc/react-query";
import { createRouterUtils } from "@orpc/react-query";
import { createRouterClient } from "@orpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { headers } from "next/headers";
import { cache } from "react";

import { createQueryClient } from "~/libs/orpc/queryClient";
import config from "~/payload.config";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
	const heads = new Headers(await headers());
	heads.set("x-orpc-source", "rsc");

	return createORPCContext({
		headers: heads,
		payloadConfig: config,
	});
});

const getQueryClient = cache(createQueryClient);

const orpc = createRouterUtils(
	createRouterClient(appRouter, {
		context: createContext,
	})
);

function HydrateClient({ children }: Readonly<{ children: React.ReactNode }>) {
	const queryClient = getQueryClient();

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			{children}
		</HydrationBoundary>
	);
}

async function prefetch(queryOptions: QueryOptionsBase<unknown, unknown>) {
	const queryClient = getQueryClient();

	// @ts-expect-error - checking if the queryOptions is infinite or not
	if (queryOptions.queryKey.at(1)?.type === "infinite") {
		return await queryClient.prefetchInfiniteQuery(queryOptions as never);
	}
	return await queryClient.prefetchQuery(queryOptions);
}

export { orpc, HydrateClient, prefetch };
