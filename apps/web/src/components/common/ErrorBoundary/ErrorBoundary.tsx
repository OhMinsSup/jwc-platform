"use client";

import {
	ErrorBoundary as ReactErrorBoundary,
	type ErrorBoundaryProps as ReactErrorBoundaryProps,
} from "@sentry/nextjs";
import type React from "react";

type ErrorBoundaryProps = ReactErrorBoundaryProps & {
	children: React.ReactNode;
};

export default function ErrorBoundary({
	children,
	...props
}: ErrorBoundaryProps) {
	return <ReactErrorBoundary {...props}>{children}</ReactErrorBoundary>;
}
