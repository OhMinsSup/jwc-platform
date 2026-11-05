import { defineConfig } from "vite-plus";

/**
 * 순수 함수(*.test.ts)와 컴포넌트(*.test.tsx)를 함께 돌린다.
 * 컴포넌트는 jsdom에서 Testing Library로 사용자 동작(클릭/선택)을 흉내 낸다.
 * 실제 브라우저 확인은 apps/web의 E2E가 맡는다.
 */
export default defineConfig({
	test: {
		include: ["test/**/*.test.{ts,tsx}"],
		environment: "jsdom",
		setupFiles: ["test/setup.ts"],
	},
});
