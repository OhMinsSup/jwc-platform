import { CenteredMessage } from "@jwc/ui-patterns/components/centered-message";
import { Button } from "@jwc/ui/components/button";
import { Link } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";

import { captureClientError } from "../analytics/client";

export function NotFound() {
	return (
		<CenteredMessage
			description="주소를 다시 확인해주세요."
			title="페이지를 찾을 수 없습니다"
		>
			<Button nativeButton={false} render={<Link to="/" />} variant="outline">
				처음으로
			</Button>
		</CenteredMessage>
	);
}

/**
 * 라우트 오류 화면. 오류 문장은 내부 상세(쿼리, 경로 등)일 수 있어 사용자에게 보여 주지 않고 오류 추적으로만 보낸다.
 * 사용자에게 보여 줄 실패는 서버 함수가 Result로 돌려준다.
 */
export function RouteError({ error, reset }: ErrorComponentProps) {
	useEffect(() => {
		captureClientError(error);
	}, [error]);
	return (
		<CenteredMessage
			description="잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 알려주세요."
			title="문제가 발생했습니다"
		>
			<Button onClick={reset} variant="outline">
				다시 시도
			</Button>
		</CenteredMessage>
	);
}
