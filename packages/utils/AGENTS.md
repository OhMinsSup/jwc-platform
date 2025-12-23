# packages/utils AGENTS.md

이 문서는 `packages/utils`(=@jwc/utils) 패키지 작업 규칙과 구조를 설명합니다.

- 범위: 날짜/포맷/옵션/암호화 등 “순수 유틸” 패키지
- 상위 규칙: 저장소 루트의 `AGENTS.md`를 우선 적용

---

## Problem 1-Pager (작업 전 5–10줄)

- 배경 / 문제 / 목표 / 비목표 / 제약(호환성, 런타임, exports)

---

## 구조

- `src/common/`
  - `omit()` 등 범용 객체 유틸
- `src/date/`
  - `dayjs` 설정(UTC/Timezone) 및 `Asia/Seoul` 포맷 유틸
- `src/format/`
  - 앱 도메인에 가까운 문자열/전화번호 포맷 유틸
- `src/options/`
  - 부서/성별/숙박/TF/티셔츠 등 옵션 목록 제공
- `src/crypto/`
  - Node.js webcrypto 기반 AES-GCM 암복호화 + SHA-256 해시

---

## 공개 API(Exports) 규칙

`package.json#exports`에 정의된 서브패스만 외부에서 import 합니다.

- `@jwc/utils/date`
- `@jwc/utils/format`
- `@jwc/utils/options`
- `@jwc/utils/crypto`
- `@jwc/utils/common`

새 모듈 추가 시:
- `src/<module>/index.ts` 생성 → `package.json#exports`에 경로 추가
- “도메인 종속성”이 강하면 이 패키지에 넣지 말지 검토

---

## 코딩 규칙

- 런타임 분리
  - `src/crypto/*`는 Node 런타임 의존(`node:crypto`, `Buffer`)이 있으므로 브라우저/Edge에서 사용 금지
  - 날짜 유틸은 timezone(DST 포함)을 고려하고, 기본은 `Asia/Seoul`
- 입력/출력
  - 전화번호/이름 등 개인정보는 가급적 정규화 후 처리
  - 암호화 결과는 Base64 문자열로만 노출(바이너리 직접 노출 금지)

---

## 로컬 검증

- `pnpm -C packages/utils typecheck`
- `pnpm -C packages/utils lint`
