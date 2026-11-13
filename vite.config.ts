/**
 * 워크스페이스 공통 정적 검사 설정 (Vite+ `vp check` / `vp lint` / `vp fmt` / `vp staged`).
 *
 * - 포맷/린트 설정은 이 파일 하나뿐이다. 패키지별 설정을 만들지 않고, 예외는 아래 overrides에 이유와 함께 둔다.
 * - 규칙의 기반은 ultracite 프리셋(core/react/tanstack/vitest)이고, 이 프로젝트 규칙(AGENTS.md)을 덧씌운다.
 * - 타입 검사는 tsrs(`pnpm typecheck`)가 맡는다. 여기서는 타입 정보를 쓰는 린트 규칙만 켠다(typeCheck: false).
 * - 앱 빌드/개발 설정은 각 앱의 vite.config.ts에 있다.
 */
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";
import vitest from "ultracite/oxlint/vitest";
import { defineConfig } from "vite-plus";
import type { OxlintConfig, OxlintOverride } from "vite-plus/lint";

type LintPreset = Pick<
	OxlintConfig,
	"env" | "overrides" | "plugins" | "rules" | "settings"
>;

/** 프리셋을 순서대로 합친다: plugins는 합집합, rules는 뒤가 우선, overrides는 이어 붙인다 */
function mergePresets(...presets: LintPreset[]): LintPreset {
	let merged: LintPreset = {};
	for (const preset of presets) {
		merged = {
			env: { ...merged.env, ...preset.env },
			overrides: [...(merged.overrides ?? []), ...(preset.overrides ?? [])],
			plugins: [
				...new Set([...(merged.plugins ?? []), ...(preset.plugins ?? [])]),
			],
			rules: { ...merged.rules, ...preset.rules },
			settings: { ...merged.settings, ...preset.settings },
		};
	}
	return merged;
}

/** AGENTS.md "필수 코딩 규칙"의 수치 제한을 린트로 강제한다 */
const PROJECT_LIMITS: OxlintConfig["rules"] = {
	complexity: ["error", { max: 10 }],
	"max-lines": [
		"error",
		{ max: 300, skipBlankLines: true, skipComments: true },
	],
	"max-lines-per-function": [
		"error",
		{ max: 50, skipBlankLines: true, skipComments: true },
	],
	"max-params": ["error", { max: 5 }],
};

/** 프리셋 중 이 코드베이스와 맞지 않는 규칙 (이유를 함께 적는다) */
const PROJECT_STYLE: OxlintConfig["rules"] = {
	// 함수 선언(호이스팅)을 쓰는 코드베이스다. 화살표 함수로 일괄 변환해도 동작/안전성 이득이 없다.
	"func-style": "off",
	// 같은 이유로 컴포넌트도 함수 선언으로 쓴다 (shadcn 생성 코드와 같은 형태)
	"react/function-component-definition": "off",
	// 인라인 핸들러를 모두 useCallback으로 감싸는 것은 측정 근거 없는 최적화다.
	// 리렌더 경계(memo 카드)에는 이미 안정 콜백을 쓴다.
	"react-perf/jsx-no-new-function-as-prop": "off",
	// 폼 값은 ""와 undefined를 모두 "비어 있음"으로 다루는 것이 의도다(`if (!value)`). 숫자(0이 유효값),
	// 객체(항상 참), 서로 다른 타입의 유니온은 계속 검사한다.
	"typescript/strict-boolean-expressions": [
		"error",
		{ allowNullableString: true, allowNullableBoolean: true },
	],
	// 함수 선언은 호이스팅되므로 아래에 둔 보조 함수/컴포넌트를 위에서 쓰는 것은 의도된 배치다.
	// 변수/클래스(TDZ가 있는 것)는 계속 검사한다.
	"no-use-before-define": ["error", { functions: false }],
	// `onClick={() => setOpen(true)}` 같은 화살표 축약은 React 관용 표현이다. 블록으로 감싸도 안전성 이득이 없다.
	"typescript/no-confusing-void-expression": [
		"error",
		{ ignoreArrowShorthand: true },
	],
	// getElementById(id)와 querySelector(`#${id}`)는 같지 않다: 선택자는 CSS 특수문자 이스케이프가 필요하고
	// 반환 타입도 Element로 넓어진다. 자동 수정이 동작을 바꾸므로 끈다.
	"unicorn/prefer-query-selector": "off",
	// 자동 수정이 Promise를 돌려주는 모든 함수에 async를 붙인다. 동기 throw가 reject로 바뀌어 의미가 달라질 수 있고,
	// 서버 함수/라우트 로더는 이미 Promise를 그대로 넘긴다. 미처리 Promise는 no-floating-promises가 잡는다.
	"typescript/promise-function-async": "off",
	// memo(function Name() {})의 이름 있는 함수는 React DevTools 표시 이름이다. 화살표로 바꾸면 이름을 잃는다.
	"prefer-arrow-callback": "off",
	// JSX 이벤트 속성(onClick/onSubmit)에 async 핸들러를 넘기는 것은 React 관용 표현이다(오류는 핸들러 안에서 처리).
	// 그 밖의 위치(조건식, 콜백 인자, spread)에서의 Promise 오용은 계속 검사한다.
	"typescript/no-misused-promises": [
		"error",
		{ checksVoidReturn: { attributes: false } },
	],
	// no-misused-promises와 겹치고, 나머지는 `(open) => !open && onClose()`처럼 반환값이 버려지는 무해한 콜백이다.
	"typescript/strict-void-return": "off",
};

/**
 * 의존 방향 (ADR-0007): packages → (앱 모름), 앱 platform → (기능 모름), 기능의 domain/model → (I/O 모름).
 * 어기는 import는 린트 오류로 막는다.
 */
const IO_MODULES = [
	"void",
	"void/*",
	"react",
	"react-dom",
	"@tanstack/*",
	"@jwc/google/*",
	// 예외: 스프레드시트 ID·주소·탭 이름 규칙은 I/O 없는 순수 함수다. 앱 domain이 Google 형식을 직접 갖지 않고
	// 이 모듈을 쓰게 해 Google 지식을 패키지 한 곳에 둔다 (ADR-0025)
	"!@jwc/google/spreadsheet-ref",
	"@jwc/observability",
	"@jwc/observability/*",
	"@jwc/security/*",
	"@jwc/analytics",
	"@jwc/ui/*",
	"@jwc/ui-patterns/*",
];

const LAYER_RULES: OxlintOverride[] = [
	{
		// 공용 패키지는 앱을 모른다 (재사용/교체 가능하게)
		files: ["packages/*/src/**"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: ["**/apps/**"],
							message: "패키지는 앱 코드를 import하지 않는다",
						},
					],
				},
			],
		},
	},
	{
		// 공통 기반(platform)은 기능(features)을 모른다. 기능이 platform을 쓴다
		files: ["apps/web/src/platform/**"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: ["**/features/**"],
							message: "platform은 features를 import하지 않는다",
						},
					],
				},
			],
		},
	},
	{
		// 순수 판단 계층: 데이터만 받고 돌려준다 (I/O, UI, 서버 모듈 금지)
		files: [
			"apps/web/src/features/*/domain/**",
			"apps/web/src/features/*/model/**",
		],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: IO_MODULES,
							message: "domain/model은 순수 함수만 둔다 (I/O·UI 모듈 금지)",
						},
						{
							group: ["**/server/**", "**/ui/**", "**/platform/**"],
							message: "domain/model은 바깥 계층을 import하지 않는다",
						},
					],
				},
			],
		},
	},
];

const OVERRIDES: OxlintOverride[] = [
	{
		// TanStack Router는 `throw redirect()` / `throw notFound()`로 흐름을 제어한다 (Error가 아닌 값을 던지는 것이 API)
		files: ["apps/web/src/routes/**"],
		plugins: ["typescript"],
		rules: { "typescript/only-throw-error": "off" },
	},
	{
		// shadcn 생성 코드: 생성기 출력을 손으로 고치지 않는다 (`ui-add`로 다시 받으면 수정이 사라진다).
		// 아래는 생성 코드가 실제로 걸리는 규칙만이다. 앱 코드에는 모두 그대로 적용된다.
		files: ["packages/ui/src/**"],
		plugins: ["react", "jsx-a11y", "typescript"],
		rules: {
			complexity: "off",
			"max-lines": "off",
			"max-lines-per-function": "off",
			"no-nested-ternary": "off",
			"no-param-reassign": "off",
			"no-shadow": "off",
			"no-use-before-define": "off",
			"jsx-a11y/click-events-have-key-events": "off",
			"jsx-a11y/label-has-associated-control": "off",
			"jsx-a11y/no-noninteractive-element-interactions": "off",
			"jsx-a11y/prefer-tag-over-role": "off",
			"react/button-has-type": "off",
			"react/hook-use-state": "off",
			"react/jsx-no-constructed-context-values": "off",
			"react/no-array-index-key": "off",
			"react/no-danger": "off",
			"react/no-unstable-nested-components": "off",
			"react/set-state-in-effect": "off",
			"typescript/consistent-return": "off",
			"typescript/no-deprecated": "off",
			"typescript/no-unsafe-argument": "off",
			"typescript/no-unsafe-assignment": "off",
			"typescript/no-unsafe-member-access": "off",
			"typescript/no-unsafe-type-assertion": "off",
			"typescript/prefer-nullish-coalescing": "off",
			"typescript/restrict-template-expressions": "off",
			"typescript/strict-boolean-expressions": "off",
		},
	},
	{
		// 테스트는 시나리오 단위로 길어진다 (함수 길이 제한은 제품 코드 기준)
		// toBe(true) → toBeTruthy()는 단언을 약하게 만든다 (1, "a"도 통과). 정확한 값 비교를 유지한다.
		files: [
			"**/*.test.{ts,tsx,mjs}",
			"apps/web/test/**",
			// 패키지가 내보내는 테스트 지원 코드 (계약 테스트, 가짜 클라이언트)
			"packages/*/src/contract.ts",
			"packages/*/src/testing.ts",
		],
		plugins: ["vitest"],
		rules: {
			"max-lines-per-function": "off",
			"vitest/prefer-to-be-falsy": "off",
			"vitest/prefer-to-be-truthy": "off",
		},
	},
	{
		// E2E는 Vitest가 아니라 Playwright다. vitest 규칙의 자동 수정은 `expect`/`test`를
		// vitest에서 import하도록 바꿔 테스트를 깨뜨린다 (safe 수정이 의미를 바꾸는 사례).
		files: ["apps/web/e2e/**"],
		plugins: ["vitest"],
		rules: {
			"max-lines-per-function": "off",
			"vitest/consistent-test-filename": "off",
			"vitest/prefer-importing-vitest-globals": "off",
		},
	},
];

/** 레포 코드가 아닌 것: 에이전트 스킬(외부 원본, .claude는 로컬 링크), 생성물, 마이그레이션 SQL */
const IGNORE_PATTERNS = [
	...(core.ignorePatterns ?? []),
	".claude/**",
	".agents/**",
	"**/.void/**",
	"**/.cloudflare/**",
	"**/.tanstack/**",
	"**/db/migrations/**",
	"**/routeTree.gen.ts",
];

const presets = mergePresets(core, react, tanstack, vitest);

export default defineConfig({
	fmt: {
		// 기존 코드 스타일 유지 (탭, 큰따옴표, 80칸)
		useTabs: true,
		singleQuote: false,
		semi: true,
		printWidth: 80,
		trailingComma: "all",
		sortImports: { ignoreCase: true, newlinesBetween: true, order: "asc" },
		sortPackageJson: true,
		sortTailwindcss: { functions: ["clsx", "cva", "cn"] },
		ignorePatterns: IGNORE_PATTERNS,
	},
	lint: {
		...presets,
		// 레포 전용 규칙 (tooling/lint-plugins/jwc.ts): jwc/no-reexport
		jsPlugins: ["./tooling/lint-plugins/jwc.ts"],
		ignorePatterns: IGNORE_PATTERNS,
		options: { typeAware: true, typeCheck: false },
		overrides: [...(presets.overrides ?? []), ...OVERRIDES, ...LAYER_RULES],
		rules: {
			...presets.rules,
			...PROJECT_LIMITS,
			...PROJECT_STYLE,
			// 배럴/재노출 금지 (모든 심볼은 정의한 파일에서 import)
			"jwc/no-reexport": "error",
			// 위 규칙이 더 엄격하게 대신한다
			"oxc/no-barrel-file": "off",
		},
	},
	staged: {
		// 커밋 전: 스테이징된 파일만 포맷 + 안전한 자동 수정 + 린트
		"*": "vp check --fix",
	},
	test: {
		// 각 패키지의 테스트 설정을 그대로 쓴다 (앱 플러그인을 테스트에 싣지 않기 위해)
		projects: [
			// 로컬 보안 검사 연결 코드: 외부 서비스 대신 고정 입력과 가짜 도구로 검증한다.
			{
				test: {
					name: "security-tools",
					include: ["scripts/security/*.test.ts"],
				},
			},
			"apps/web/vitest.config.ts",
			"packages/analytics",
			"packages/common",
			"packages/form-core",
			"packages/google",
			"packages/observability",
			"packages/security",
			"packages/submission-store",
			"packages/ui-patterns",
			"tooling/typecheck",
		],
	},
});
