"use client";

import { Button } from "@jwc/ui";
import type React from "react";
import { useCallback } from "react";

interface BaseErrorFallbackProps<TError = unknown> {
	error: TError;
	componentStack: string;
	eventId: string;
	resetError: () => void;
	unexpectedErrorHandler?: (
		props: Pick<
			BaseErrorFallbackProps<TError>,
			"error" | "resetError" | "componentStack" | "eventId"
		>
	) => React.ReactElement | null;
}

export default function BaseErrorFallback<TError>({
	unexpectedErrorHandler,
	...props
}: BaseErrorFallbackProps<TError>) {
	return (
		<>
			{unexpectedErrorHandler ? (
				unexpectedErrorHandler(props)
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
								type="button"
								variant="outline"
								onClick={useCallback(() => {
									location.reload();
								}, [])}
							>
								홈으로 돌아가기
							</Button>
							<Button type="button" onClick={props.resetError}>
								초기화
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
