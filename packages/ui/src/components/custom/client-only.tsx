"use client";

import type React from "react";
import { useSyncExternalStore } from "react";

interface ClientOnlyProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

// No-op unsubscribe function for useSyncExternalStore
const emptySubscribe = () => (): void => {
	// Intentionally empty - server-side rendering doesn't need subscription
};

function ClientOnly({ children, fallback }: ClientOnlyProps) {
	const value = useSyncExternalStore(
		emptySubscribe,
		() => "client",
		() => "server"
	);

	if (value === "server") {
		return fallback ?? null;
	}

	return <>{children}</>;
}

export { ClientOnly };
