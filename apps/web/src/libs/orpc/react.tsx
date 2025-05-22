"use client";

import type { AppRouter } from "@jwc/api";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterUtils } from "@orpc/react-query";
import { createORPCReactQueryUtils } from "@orpc/react-query";
import type { RouterClient } from "@orpc/server";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createContext, use, useState } from "react";

import { createQueryClient } from "~/libs/orpc/queryClient";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
	if (typeof window === "undefined") {
		// Server: always make a new query client
		return createQueryClient();
	}
	// Browser: use singleton pattern to keep the same query client
	if (!clientQueryClientSingleton) {
		clientQueryClientSingleton = createQueryClient();
	}
	return clientQueryClientSingleton;
};

type ORPCReactUtils = RouterUtils<RouterClient<AppRouter>>;

const ORPCContext = createContext<ORPCReactUtils | null>(null);

export function useORPC(): ORPCReactUtils {
	const ctx = use(ORPCContext);
	if (!ctx) throw new Error("ORPCContext is not set up properly");
	return ctx;
}

export function ORPCReactProvider({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const queryClient = getQueryClient();

	const [client] = useState<RouterClient<AppRouter>>(() =>
		createORPCClient(
			new RPCLink({
				url: new URL("/rpc", getBaseUrl()),
				headers: {
					"x-orpc-source": "react-nextjs",
				},
			})
		)
	);

	const [orpc] = useState(() =>
		createORPCReactQueryUtils<RouterClient<AppRouter>>(client)
	);

	return (
		<QueryClientProvider client={queryClient}>
			<ORPCContext.Provider value={orpc}>{children}</ORPCContext.Provider>
		</QueryClientProvider>
	);
}

const getBaseUrl = () => {
	if (typeof window !== "undefined") return window.location.origin;
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
	// eslint-disable-next-line no-restricted-properties
	return `http://localhost:${process.env.PORT ?? 3000}`;
};
