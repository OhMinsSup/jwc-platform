import { defineConfig } from "vite-plus";

/** 단위 테스트는 순수 모듈/경계 클라이언트만 대상으로 하므로 void/TanStack 플러그인을 로드하지 않는다 */
export default defineConfig({
	test: { include: ["test/**/*.test.ts"], environment: "node" },
});
