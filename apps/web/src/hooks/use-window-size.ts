import { useEffect, useState } from "react";

interface WindowSize {
	width: number;
	height: number;
}

/**
 * 윈도우 크기를 추적하는 커스텀 훅
 */
export function useWindowSize(): WindowSize {
	const [windowSize, setWindowSize] = useState<WindowSize>(() => {
		if (typeof window === "undefined") {
			return { width: 0, height: 0 };
		}
		return {
			width: window.innerWidth,
			height: window.innerHeight,
		};
	});

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const handleResize = () => {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		window.addEventListener("resize", handleResize);

		// 초기값 설정 (SSR 대응)
		handleResize();

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return windowSize;
}
