import type { RcFile } from "syncpack";

/**
 * syncpack: 워크스페이스 의존성 버전 일관성 검사 (`pnpm check:deps`, 자동 수정은 `pnpm fix:deps`).
 *
 * - 같은 의존성은 모든 패키지에서 같은 버전이어야 한다 (기본 그룹: 가장 높은 버전 기준).
 * - catalog에 있는 의존성은 반드시 `catalog:`로 참조한다 (기본 그룹이 DiffersToCatalog로 잡는다).
 * - 툴체인(Vite+ 번들과 맞물린 것)은 범위 없이 정확한 버전만 쓴다.
 */
const config: RcFile = {
	versionGroups: [
		{
			label: "워크스페이스 패키지는 모두 private이라 version 필드가 없다",
			dependencyTypes: ["local"],
			isIgnored: true,
		},
		{
			label:
				"vite는 루트 overrides가 Vite+ 코어(npm 별칭)로 고정한다. 앱의 devDependency 범위는 플러그인 peer 표기용",
			dependencies: ["vite"],
			isIgnored: true,
		},
	],
	semverGroups: [
		{
			label:
				"Vite+ 툴체인과 tsrs는 정확한 버전만 쓴다 (번들 버전과 어긋나면 사본이 둘이 된다)",
			dependencies: [
				"vite-plus",
				"oxlint",
				"oxfmt",
				"vitest",
				"ultracite",
				"tsrs",
			],
			range: "",
		},
	],
};

export default config;
