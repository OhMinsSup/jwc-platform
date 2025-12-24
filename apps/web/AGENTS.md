# apps/web AGENTS.md

이 문서는 `apps/web`(웹 앱) 변경 시 따라야 할 규칙/패턴을 정리합니다.

## Problem 1-Pager (필수)

코드를 바꾸기 전에 아래를 5–10줄로 먼저 씁니다.

- 배경: 왜 지금 바꾸는가?
- 문제: 현재 무엇이 깨지거나 불편한가?
- 목표: 이번 변경에서 달성할 것(측정 가능)
- 비목표: 이번 변경에서 하지 않을 것
- 제약: 라우팅/SSR/Convex/Auth/환경변수/배포(Vercel) 관련 제약

## 스택/구조 요약

- Vite + TanStack Start/Router (file-based routes)
- Convex + React Query 통합(`@convex-dev/react-query`)
- Better Auth + Convex plugin (`@convex-dev/better-auth`)
- UI는 `@jwc/ui`(Tailwind preset 포함)를 사용

## 라우팅 규칙 (TanStack Start)

- 라우트는 `src/routes/**`의 `createFileRoute(...)`로 정의합니다.
- 리다이렉트/검색파라미터 검증은 라우트 레벨에서 처리합니다.
  - 예: 온보딩은 `validateSearch`로 `phoneHash`를 검증
  - 예: 잘못된 step slug는 즉시 `welcome`으로 redirect
- 서버 핸들러는 라우트의 `server.handlers`를 사용합니다.

## Convex/SSR 데이터 패턴

- SSR/loader에서는 `convexQuery(...)` + `queryClient.ensureQueryData(...)` 패턴을 우선 사용합니다.
- 루트 라우트(`src/routes/__root.tsx`)에서 서버에서 읽은 Better Auth 토큰을 Convex 쿼리 클라이언트에 주입합니다.
  - 이 흐름을 우회하거나 임의로 쿠키/토큰을 직접 파싱하지 않습니다.

## 인증(Auth) 규칙

- `/api/auth/$` 라우트는 `reactStartHandler(request)`로 Better Auth 핸들러를 위임합니다.
- 서버 사이드에서 Convex를 호출해야 하면 `src/lib/auth-server.ts`의 `fetchQuery/fetchMutation/fetchAction` 헬퍼를 우선 사용합니다.

## Webhook 규칙

- `/api/webhook/spreadsheet`는 서버 핸들러입니다.
- 입력은 반드시 검증하고, 실패 시 명확한 상태코드/메시지로 응답합니다.
- 시크릿 헤더(`x-webhook-secret`)는 비교 시 로깅하지 않습니다(값 자체를 절대 출력 금지).

## 상태관리 (Onboarding)

- 온보딩 스텝/검증은 `src/store/onboarding-form-store.ts`가 단일 소스입니다.
- 스텝을 추가/제거하면 아래를 함께 갱신합니다.
  - `STEPS`/`STEP_LABELS`
  - `isValidStep`/`getNextStep`/`getPrevStep`
  - `src/routes/onboarding/$step.tsx`의 lazy import + switch
- 주의: 현재 store는 `isFormComplete()`에서 `additionalInfo.tshirtSize`를 요구합니다.
  - 스텝을 비활성화/주석 처리할 경우, 완주 조건과 UI 흐름이 불일치할 수 있으니 함께 정리합니다.

## 주요 라우트 메모

- `/` : 홈(Convex health check로 접수 상태 표시)
- `/onboarding` : 레이아웃 라우트, `/onboarding/welcome`로 redirect
- `/onboarding/$step` : step slug 검증 후 각 스텝 컴포넌트 lazy-load
- `/api/auth/$` : Better Auth 핸들러 위임
- `/api/webhook/spreadsheet` : 스프레드시트 편집 이벤트 webhook
- `/s/$code` : 단축 URL(SSR에서 302 redirect)
- `/application/` : 현재 `beforeLoad`에서 `/`로 강제 redirect (의도 확인 없이 제거 금지)
- `/application/$id` : 신청 상세(SSR loader로 데이터 조회)

## 환경변수

- 필수
  - `VITE_CONVEX_URL`: Convex endpoint (없으면 라우터에서 에러 로그 발생)
- 선택(기능에 따라 사용)
  - `VITE_PAID_ACCOUNT_NUMBER`: 신청 상세의 입금 계좌 표기
  - `SPREADSHEET_WEBHOOK_SECRET`: webhook 인증(설정 시 요청 헤더와 일치해야 함)
  - `GOOGLE_SPREADSHEET_ID`: webhook에서 스프레드시트 ID 검증

## 실행/검증 커맨드

- 개발 서버: `pnpm -C apps/web dev`
- 프로덕션 빌드: `pnpm -C apps/web build`
- 프리뷰 서빙: `pnpm -C apps/web serve`
- 워크스페이스 린트: `pnpm -w lint`
- 워크스페이스 타입체크: `pnpm -w typecheck`

## UI/스타일 규칙

- 스타일은 `@jwc/ui` 프리셋 + Tailwind v4를 따릅니다.
- Tailwind 클래스는 Biome 규칙(`useSortedClasses`)에 맞춰 정렬합니다(가능하면 `pnpm fix:ultracite` safe 모드).
