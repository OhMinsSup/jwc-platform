# 페이지 성능 검증

Google의 좋은 Core Web Vitals 기준은 LCP ≤2,500ms, INP ≤200ms, CLS ≤0.1이다.
검색 비노출 여부와 관계없이 같은 사용자 경험 목표로 사용한다.

최근 결과: [2026-11-09 전 페이지 85개 표본](pages-2026-11-09.md).

## 실험실 검사

Node 24와 Chromium 설치 후 `pnpm -C apps/web test:performance`를 실행한다.
기본 5회이며 `PERFORMANCE_SAMPLES=1`은 시나리오 디버깅용이다.
새 context마다 캐시를 비우고 Pixel 7 viewport·CPU 4배 제한·다운로드 1.6Mbps·업로드 0.75Mbps·지연 150ms를 설정한다.
각 페이지는 실제 제목·HTTP 상태·경로·브라우저 오류와 입력/클릭 동작도 검사한다.
숫자가 없으면 실패하며, 다음 paint 없이 문서를 떠나는 링크의 INP는 미보고로 표시할 수 있다. 0으로 대체하지 않는다.
보고서는 페이지별 표본·최솟값·nearest-rank p75·최댓값을 남긴다. 예산 초과나 측정 실패는 CI를 실패시킨다.

production 빌드를 별도 Cloudflare preview에서 실행한다. 공개 더미 `config/env/performance/.dev.vars`만 사용하며 `.void/performance`에만 시드한다.
메모리 응답 저장소와 로그 SMS를 사용하고 Google Sheets·실제 SMS에는 연결하지 않는다.
관리자 화면은 시드한 유효 세션을 서버가 검증한다. 인증 우회 코드나 실제 계정은 사용하지 않는다.
로컬 preview에는 자산 압축이 없어서 테스트 전용 proxy가 `/assets/*.css|js`만 gzip으로 스트리밍한다. 운영 CDN의 압축 조건을 재현하는 실험이며 운영 네트워크 실측은 아니다.
폰트는 앱과 같은 고정 버전 CDN에서 받으며 외부 로딩 실패도 검사한다.

`typecheck`/E2E/dev와 동시에 실행하면 공유 Void 메타데이터와 CPU 때문에 결과가 잘못될 수 있다.
CI는 성능 검사 전용 runner를 사용한다. 성능 산출물은 `apps/web/test-results/**/vitals.json`이며 세션·신청 ID·답변·개인정보는 넣지 않는다.
기능 E2E는 SMS/TOTP 성공·실패와 공개 신청 과정을 별도로 검사한다.

## 범위

공개 목록·입력·확인·완료·신청 내역, 로그인·가입·SMS 확인·TOTP 등록·TOTP 로그인·비밀번호 재설정,
관리자 폼 목록·관리자 관리·편집기·미리보기·응답 목록, 404의 17개 화면을 측정한다.
라우트 추가 시 단위 검사에서 누락된 화면을 알린다. 대표 폼·응답 fixture를 사용하므로 모든 데이터 크기에 대한 보장은 아니다.
날짜/시각 입력과 조건부 필드, 많은 필드의 입력 렌더링은 별도 기능·렌더링 테스트로 검증한다.

## 운영에서 확인할 것

기존 PostHog 키가 설정되면 LCP·INP·CLS 숫자를 수집한다. DOM attribution과 상세 이벤트는 제거하고 신청 ID가 들어간 URL도 정리한다.
SDK 지표는 document 수명 기준이다. SPA 내부 이동별 지표나 매 화면별 독립적인 LCP를 수집한다고 해석하지 않는다.
실험실 5회의 p75는 실제 사용자의 p75가 아니다. Google의 최종 통과 여부는 배포 후 모바일·데스크톱 각각의 실제 사용자 75백분위와 28일 데이터로 확인한다.
관리자·비공개 사이트는 CrUX 표본이 부족할 수 있으므로 개인정보를 제거한 RUM도 함께 확인한다.

기준: https://developers.google.com/search/docs/appearance/core-web-vitals
결정: [ADR-0016](../adr/0016-page-performance-budgets.md)
