// @vitest-environment jsdom
import { useIsMobile } from "@jwc/ui/hooks/use-mobile";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

/** 가짜 matchMedia: 현재 일치 여부를 바꾸고 change 구독자에게 알린다 */
function fakeMatchMedia(initial: boolean) {
	let matches = initial;
	const listeners = new Set<() => void>();
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			get matches() {
				return matches;
			},
			addEventListener: (_type: string, listener: () => void) =>
				listeners.add(listener),
			removeEventListener: (_type: string, listener: () => void) =>
				listeners.delete(listener),
		})),
	);
	return {
		listeners,
		change(next: boolean) {
			matches = next;
			for (const listener of listeners) {
				listener();
			}
		},
	};
}

function Probe() {
	return createElement("output", null, useIsMobile() ? "mobile" : "desktop");
}

describe(useIsMobile, () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("서버 렌더는 데스크톱으로 그린다 (matchMedia를 읽지 않는다)", () => {
		const media = fakeMatchMedia(true);
		expect(renderToString(createElement(Probe))).toContain("desktop");
		expect(media.listeners.size).toBe(0);
	});

	it("브라우저에서는 첫 렌더부터 현재 폭을 읽고, 폭이 바뀌면 다시 그린다", () => {
		const media = fakeMatchMedia(true);
		// 문서에 붙이지 않은 요소에도 그릴 수 있다 (구독·해제만 확인)
		const container = document.createElement("div");
		const root = createRoot(container);
		act(() => root.render(createElement(Probe)));
		expect(container.textContent).toBe("mobile");

		act(() => media.change(false));
		expect(container.textContent).toBe("desktop");

		act(() => root.unmount());
		expect(media.listeners.size).toBe(0);
	});
});
