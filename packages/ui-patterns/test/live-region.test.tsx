import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vite-plus/test";

import { LiveRegion } from "../src/components/live-region";
import type { LiveRegionHandle } from "../src/components/live-region";

/** 알림 문장은 다음 애니메이션 프레임에 들어간다 */
async function nextFrame() {
	await act(
		() =>
			// oxlint-disable-next-line promise/avoid-new -- requestAnimationFrame(콜백 API)를 기다리는 테스트 도우미
			new Promise<void>((resolve) => {
				requestAnimationFrame(() => resolve());
			}),
	);
}

describe(LiveRegion, () => {
	it("ref의 announce로 받은 문장을 polite 영역에 표시한다", async () => {
		const ref = createRef<LiveRegionHandle>();
		const { container } = render(<LiveRegion ref={ref} />);
		const region = container.querySelector('[aria-live="polite"]');

		act(() => ref.current?.announce("1번 페이지를 옮겼습니다"));
		await nextFrame();

		expect(region?.textContent).toBe("1번 페이지를 옮겼습니다");
	});

	it("같은 문장을 다시 알리면 한 번 비운 뒤 다시 채운다 (화면 낭독기가 다시 읽게)", async () => {
		const ref = createRef<LiveRegionHandle>();
		const { container } = render(<LiveRegion ref={ref} />);
		const region = container.querySelector('[aria-live="polite"]');
		act(() => ref.current?.announce("저장했습니다"));
		await nextFrame();

		act(() => ref.current?.announce("저장했습니다"));
		expect(region?.textContent).toBe("");
		await nextFrame();
		expect(region?.textContent).toBe("저장했습니다");
	});

	it("해제되면 ref가 비어 부모의 알림이 무시된다", () => {
		const ref = createRef<LiveRegionHandle>();
		const { unmount } = render(<LiveRegion ref={ref} />);
		unmount();
		expect(ref.current).toBeNull();
	});
});
