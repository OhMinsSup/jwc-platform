import type { KnipConfig } from "knip";

/**
 * knip: 쓰이지 않는 파일 / export / 의존성 탐지 (`pnpm check:unused`).
 *
 * 대부분의 entry는 knip 플러그인이 설정 파일(vite, vitest, tanstack router 등)에서 스스로 찾는다.
 * 여기에는 플러그인이 찾지 못하는 entry와 정적 import 밖에서 쓰이는 것만, 이유와 함께 적는다.
 * "안 쓰는데 남겨 둔" 코드를 숨기려고 ignore를 늘리지 않는다. 그런 것은 지우거나 리포트에 남긴다.
 */
const config: KnipConfig = {
	// 로컬 에이전트 스킬(레포에 추적하지 않음)
	ignore: [".agents/**"],
	workspaces: {
		".": {},
		"apps/web": {
			entry: [
				// void가 정적으로 읽는 런타임 진입점 (워커, 환경 스키마, 큐/크론 소비자)
				"server.ts",
				"void.config.ts",
				"env.ts",
				"queues/*.ts",
				"crons/*.ts",
				// drizzle 스키마 (void db generate가 읽는다)
				"db/schema.ts",
				// 파일 라우트 (TanStack Router가 디렉터리를 스캔한다)
				"src/routes/**/*.{ts,tsx}",
			],
			project: ["**/*.{ts,tsx,css}"],
		},
		"packages/ui": {
			// shadcn 컴포넌트는 package.json exports(subpath)로 공개된다. 앱이 아직 쓰지 않는 컴포넌트도
			// 공용 세트로 유지하므로 모든 공개 파일을 entry로 둔다.
			entry: ["src/components/*.tsx", "src/hooks/*.ts", "src/lib/*.ts"],
		},
		"tooling/typecheck": {
			// cli.mjs가 플랫폼에 따라 `require.resolve(`${compiler}/package.json`)`로 고른다.
			// 정적 import가 없어 knip이 사용처를 보지 못한다.
			ignoreDependencies: ["tsrs"],
		},
	},
};

export default config;
