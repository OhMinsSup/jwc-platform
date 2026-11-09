import { useEffect, useState } from "react";

/**
 * 스크린리더 알림 영역. 상태를 이 컴포넌트 안에만 두어 알림이 편집기 전체를 리렌더하지 않게 한다.
 * 부모는 register로 받은 함수를 ref에 보관해 호출한다.
 */
export function LiveRegion({
	register,
}: {
	register: (announce: (message: string) => void) => void;
}) {
	const [message, setMessage] = useState("");
	useEffect(() => {
		register((next) => {
			// 같은 문장을 연속으로 알려도 다시 읽히도록 한 번 비운다
			setMessage("");
			requestAnimationFrame(() => setMessage(next));
		});
	}, [register]);
	return (
		<p aria-live="polite" className="sr-only">
			{message}
		</p>
	);
}
