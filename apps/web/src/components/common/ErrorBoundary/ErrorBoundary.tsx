"use client";

import type React from "react";
import type { ErrorBoundaryProps as ReactErrorBoundaryProps } from "react-error-boundary";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

type ErrorBoundaryProps = ReactErrorBoundaryProps & {
	children: React.ReactNode;
};

export default function ErrorBoundary({
	children,
	...props
}: ErrorBoundaryProps) {
	return <ReactErrorBoundary {...props}>{children}</ReactErrorBoundary>;
}
