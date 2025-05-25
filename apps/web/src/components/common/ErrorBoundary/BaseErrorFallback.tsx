"use client";

import { Button } from "@jwc/ui";
import * as Sentry from "@sentry/nextjs";
import type React from "react";
import { useEffect } from "react";
import type { UseErrorBoundaryApi } from "react-error-boundary";
import { useErrorBoundary } from "react-error-boundary";

interface BaseErrorFallbackProps<TError = unknown> {
	error: TError;
	unexpectedErrorHandler?: (
		error: UseErrorBoundaryApi<TError>
	) => React.ReactElement | null;
}

export default function BaseErrorFallback<TError>({
	unexpectedErrorHandler,
	error,
}: BaseErrorFallbackProps<TError>) {
	const api = useErrorBoundary<TError>();

	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<>
			{unexpectedErrorHandler ? (
				unexpectedErrorHandler(api)
			) : (
				<div className="h-svh">
					<div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
						<h1 className="font-bold text-[7rem] leading-tight">404</h1>
						<span className="font-medium">페이지를 찾을 수 없습니다.</span>
						<p className="text-center text-muted-foreground">
							죄송합니다. 요청하신 페이지를 찾을 수 없습니다. <br />
							아니면 페이지가 삭제되었거나 이동되었을 수 있습니다.
						</p>
						<div className="mt-6 flex gap-4">
							<Button
								variant="outline"
								onClick={() => {
									location.reload();
								}}
							>
								홈으로 돌아가기
							</Button>
							<Button onClick={() => api.resetBoundary()}>초기화</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
