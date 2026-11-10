import { useImperativeHandle, useState } from "react";
import type { Ref } from "react";

/** 부모가 ref로 받는 알림 함수 */
export interface LiveRegionHandle {
	announce: (message: string) => void;
}

/**
 * 스크린리더 알림 영역. 상태를 이 컴포넌트 안에만 두어 알림이 편집기 전체를 리렌더하지 않게 한다.
 * 부모는 ref로 받은 announce를 호출한다 (마운트 전·해제 후에는 ref가 null).
 */
export function LiveRegion({ ref }: { ref: Ref<LiveRegionHandle> }) {
	const [message, setMessage] = useState("");
	useImperativeHandle(
		ref,
		() => ({
			announce: (next) => {
				// 같은 문장을 연속으로 알려도 다시 읽히도록 한 번 비운다
				setMessage("");
				requestAnimationFrame(() => setMessage(next));
			},
		}),
		[],
	);
	return (
		<p aria-live="polite" className="sr-only">
			{message}
		</p>
	);
}
