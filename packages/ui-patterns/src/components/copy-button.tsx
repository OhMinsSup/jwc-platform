import { Button } from "@jwc/ui/components/button";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

const RESET_MS = 1500;

/** 클립보드 복사. 성공 여부를 아이콘과 스크린리더 문구로 알린다 */
export function CopyButton({ text, label }: { text: string; label: string }) {
	const [copied, setCopied] = useState(false);
	useEffect(() => {
		// 복사 표시가 켜졌을 때만 타이머를 건다 (clearTimeout(undefined)는 아무 일도 하지 않는다)
		const timer = copied
			? setTimeout(() => setCopied(false), RESET_MS)
			: undefined;
		return () => clearTimeout(timer);
	}, [copied]);
	const copy = async () => {
		// http(비보안) 환경에는 clipboard API가 없다 (DOM 타입은 항상 있다고 선언하므로 넓혀서 검사)
		const clipboard: Clipboard | undefined = navigator.clipboard;
		if (clipboard === undefined) {
			return;
		}
		try {
			await clipboard.writeText(text);
			setCopied(true);
		} catch (error) {
			// 권한 거부(NotAllowedError)만 처리. 나머지는 버그이므로 그대로 던진다
			if (!(error instanceof DOMException)) {
				throw error;
			}
		}
	};
	const Icon = copied ? Check : Copy;
	return (
		<Button
			aria-label={label}
			className="relative z-10 h-7 w-7"
			onClick={copy}
			size="icon"
			title={label}
			variant="ghost"
		>
			<Icon aria-hidden className="h-3.5 w-3.5" />
			<span aria-live="polite" className="sr-only">
				{copied ? "복사했습니다" : ""}
			</span>
		</Button>
	);
}
