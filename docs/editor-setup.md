# VS Code · Zed 프로젝트 설정

## Problem 1-Pager

- 배경: pnpm 모노레포이며 TypeScript 7, Vite+, Tailwind CSS 4를 사용한다. CLI 타입 검증은 `jwc-typecheck`가 담당한다.
- 문제: 기존 VS Code 설정은 레거시 TypeScript 서버 선택 방식이고, Zed는 기본 vtsls를 사용한다. TypeScript 7은 `tsserver.js`를 제공하지 않아 에디터가 다른 버전으로 폴백할 수 있다. Tailwind 설정도 앱에서 추가한 토큰을 읽지 못한다.
- 목표: 두 에디터가 설치된 TypeScript 7과 루트 `vite.config.ts`를 읽고, 앱·공용 UI의 클래스 자동완성 및 같은 개발·검증 명령을 제공한다.
- 비목표: 앱 동작·디자인·컴파일러 버전 변경, 개인 에디터 설정 덮어쓰기, 실제 환경 파일 사용, 서버·E2E 자동 실행.
- 제약: 저장 시 안전한 수정만 적용한다. 앱의 Workers 타입과 E2E의 Node 타입은 기존 tsconfig로 분리한다. `.void`의 생성된 타입 파일을 타입 서버 감시에서 제외하지 않는다.

## 대안과 영향도

- A: 기존 tsserver/vtsls를 유지하고 TypeScript 6 SDK를 추가한다. 장점은 기존 확장과의 호환성이다. 단점은 별도 SDK 관리이며, 위험은 TypeScript 7 CLI와 진단이 달라지는 것이다.
- B (채택): TypeScript 7 네이티브 LSP를 사용한다. 장점은 프로젝트의 컴파일러를 그대로 사용하는 것이다. 단점은 네이티브 서버 확장 설치가 필요하며, 위험은 레거시 tsserver 플러그인이 작동하지 않는 것이다.
- 린트·포맷 규칙을 에디터에 복사하는 대신 루트 Vite+ 설정 경로를 지정한다. CLI 검증의 원본은 유지한다.
- Tailwind는 `apps/web/src/styles.css`를 진입점으로 사용한다. 여기서 공용 UI·패턴 스타일을 import하므로 앱 고유 색·글꼴·utility까지 자동완성에 포함한다.

## 최초 준비

저장소 루트를 프로젝트로 연다. `apps/web`만 열면 루트의 에디터 설정을 읽지 않는다.

```sh
nvm use
pnpm install --frozen-lockfile
pnpm -C apps/web codegen
```

`codegen`은 `void/env`와 앱의 `.void/tsconfig.json` 등 생성 타입을 준비한다. 처음 열었을 때 `void/*` 또는 상위 tsconfig 오류가 나오면 이 명령을 실행한 뒤 언어 서버를 다시 시작한다.

## VS Code

1. 작업 영역의 권장 확장을 설치한다: Vite Plus Extension Pack, TypeScript 7 (`TypeScriptTeam.native-preview`), Tailwind CSS IntelliSense.
2. 네이티브 TypeScript 서버를 사용하도록 `js/ts.experimental.useTsgo`를 켰다. SDK 경로는 프로젝트의 `node_modules/typescript`다.
3. 프로젝트 SDK 사용 알림이 나타나면 허용한다. 에디터의 워크스페이스 신뢰·SDK 동의는 설정 파일로 우회하지 않는다. 버전 선택 메뉴에서 프로젝트 버전인지 확인할 수 있다.
4. 변경 후 `Developer: Reload Window`를 실행한다. 문제가 계속되면 `TypeScript: Restart Server`와 `Oxc: Restart oxlint Server` / `Restart oxfmt Server`를 실행한다.

현재 `js/ts` 설정을 지원하는 최신 VS Code와 TypeScript 7 확장을 기준으로 한다. Oxc가 루트 Vite+를 자동 감지하며, 설정 경로도 루트로 고정했다. 저장 시 Oxc 포맷과 `safe_fix`만 실행하고, 별도의 import 정렬 액션은 실행하지 않는다.

## Zed

1. Extensions에서 **Oxc** (`oxc`)와 **TypeScript Language Server** (`tsgo`, 서버 이름 `typescript-ls`)를 설치한다. 프로젝트 설정은 사용자 전역 확장을 자동 설치하지 않는다.
2. JS/JSX/TS/TSX는 `typescript-ls`를 사용하고 `vtsls` / `typescript-language-server`는 끈다. `...`를 유지해 Tailwind 등 나머지 서버가 함께 동작하게 한다.
3. 네이티브 서버는 `./node_modules/typescript/bin/tsc --lsp --stdio`로 실행한다. 별도로 다운로드한 최신 TypeScript가 프로젝트 버전을 대신하지 않는다. Node는 `.nvmrc`의 버전이 셸에서 잡혀 있어야 한다.
4. `editor: restart language server`로 재시작한다. Oxc 확장은 프로젝트의 Vite+를 감지해 `vp lint --lsp` / `vp fmt --lsp`를 사용한다.

이 실행 경로는 macOS/Linux의 실행 가능한 TypeScript Node 진입점을 사용한다. Windows에서 여는 경우 Zed 사용자 설정에서 `typescript-ls.binary`를 Windows의 Node 실행 경로와 `node_modules/typescript/lib/tsc.js --lsp --stdio` 인자로 바꾼다.

## 공통 작업

VS Code의 **Tasks: Run Task**, Zed의 **task: spawn**에서 `JWC:` 작업을 선택한다. 타입 생성·전체 타입 검사·포맷/린트 검사·단위 테스트·더미 환경 개발 서버를 제공한다. 프로젝트를 여는 것만으로 명령을 실행하지 않는다.

- 타입 오류 확인: `pnpm typecheck` (필요하면 `pnpm typecheck:tsc`와 비교).
- 포맷·린트 확인: `pnpm check`. 자동수정은 `pnpm fix` 후 diff를 확인한다.
- 단위 테스트: `pnpm test`.
- 개발: `pnpm dev` (공개 더미 설정). 실제 `.env`를 사용하는 작업은 추가하지 않았다.

앱의 타입 생성과 dev·E2E·성능 검증은 공유 Void 생성물을 쓸 수 있다. 이 작업들을 동시에 실행하지 않는다. 저장 시 에디터 진단은 CI 전체 검증을 대체하지 않는다.

## 근거

- [Vite+ IDE integration](https://viteplus.dev/guide/ide-integration)
- [Microsoft TypeScript 7 에디터 안내](https://github.com/microsoft/typescript-go#preview)
- [Zed TypeScript 네이티브 확장](https://github.com/zed-extensions/tsgo)
- [Zed Tailwind 설정](https://zed.dev/docs/languages/tailwindcss)
