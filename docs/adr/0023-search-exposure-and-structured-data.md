# ADR-0023: 홈·공개 폼의 검색/AI 노출, 구조화 데이터, 수집기 파일

- 상태: 채택
- 작성일: 2026-11-10
- 관련: ADR-0015(메타데이터·검색 비노출), ADR-0022(공유 미리보기·robots.txt)
- 변경: ADR-0015의 "공개 신청폼까지 noindex 유지"와 ADR-0022의 "검색엔진 전체 차단"을 "홈·접수 중인 공개 폼만 노출"로 바꾼다

## Problem 1-Pager

- 배경: 모든 화면에 `noindex, nofollow` 메타가 있고, robots.txt는 링크 미리보기 수집기 외의 모든 수집기(검색·AI)를 막았다. 공개 폼 화면은 단계 제목이 h1이고 폼 제목은 문단이었다.
- 문제: 신청서를 찾는 사람이 검색이나 AI 답변으로 접수 중인 신청서에 닿을 수 없다. 구조화 데이터와 canonical이 없어 같은 폼이 질의 문자열(`?step=`)마다 다른 문서로 보일 수 있다.
- 목표: 홈과 접수 중인 공개 폼만 검색·AI 수집기에 노출한다. 화면 구성에 맞는 schema.org 구조화 데이터, canonical·og:url, sitemap·llms.txt를 제공한다.
- 비목표: 폼별 OG 이미지, 다국어(hreflang), 검색 콘솔 등록·운영 배포, 신청 완료·신청 내역·관리자 화면 노출.
- 제약: 개인정보 화면(`/r/`, `/admin`)은 계속 막는다(PRIVATE_PATHS, `x-robots-tag`). 질의 문자열·토큰을 canonical이나 구조화 데이터에 넣지 않는다. 화면에 없는 사실(일정·주최 등)을 구조화 데이터로 만들지 않는다.

## 결정

- **노출 범위 (사용자 선택)**: 홈(`/`)과 `status === "open"`인 공개 폼(`/f/<slug>`)만 `index, follow, max-image-preview:large, max-snippet:-1`. root의 기본값은 `noindex, nofollow`로 두고, 노출 화면만 같은 name의 meta로 덮는다(HeadContent는 하위 값이 이긴다). 마감·접수 전 폼, 신청 완료, 신청 내역, 관리자, 오류 화면은 기본값을 따른다.
- **canonical·og:url**: 노출 화면만 `SITE_URL` 출처의 절대 주소로 선언한다. 질의 문자열과 조각은 버린다. 출처를 모르면(root 로더 실패) 아무것도 선언하지 않아 noindex가 남는다.
- **구조화 데이터 (JSON-LD)**: `platform/structured-data.ts`.
  - 홈: `WebSite` + `CollectionPage`(mainEntity = 접수 중인 신청서 `ItemList`, 화면 순서).
  - 공개 폼: `WebSite` + `WebPage`(폼 제목·설명) + `BreadcrumbList`(Formpass → 폼).
  - head()의 `scripts`로 넣는다. 폼 제목·설명은 운영자 입력이라 `<`, `>`, `&`, U+2028/2029를 JSON 유니코드 이스케이프로 바꿔 `</script>`로 태그를 닫지 못하게 한다(`jsonLdScript`, 단위 테스트).
- **robots.txt·sitemap.xml·llms.txt**: 사이트 출처가 환경마다 달라 정적 파일(`public/robots.txt`)을 지우고 서버 라우트(`routes/robots[.]txt.ts` 등)가 요청 때 만든다. 모든 수집기(`*`)에 `Allow: /`, 개인정보 화면과 서버 엔드포인트(`/r/`, `/admin`, `/api/`, `/_serverFn/`)는 `Disallow`. 신청 완료 화면은 robots로 막지 않고 noindex 메타로 뺀다(막으면 수집기가 noindex를 읽지 못한다). 응답은 `public, max-age=3600`.
- **문서 구조**: 공개 폼 화면의 h1은 폼 제목 하나(검색 결과 제목과 같은 값), 단계 제목은 h2, 확인 단계의 페이지 묶음 제목은 h3.
- **기타 메타**: `application-name`, `apple-mobile-web-app-title`을 서비스 이름으로 둔다.

## 대안

| 대안                                                 | 장점                                          | 단점·위험                                                                 | 결정   |
| ---------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- | ------ |
| 홈 + 접수 중인 공개 폼만 노출                        | 신청서를 찾는 경로가 생김, 개인정보 화면 유지 | 공개 폼 주소가 검색 결과에 남음(마감 후 noindex로 빠지기까지 시간이 걸림) | 채택   |
| 홈만 노출                                            | 노출 범위가 가장 작음                         | 정작 찾으려는 신청서는 검색되지 않음                                      | 미채택 |
| noindex 유지 + 태그만 정리                           | 정책 변경 없음                                | 구조화 데이터·canonical이 검색에 쓰이지 않아 효과가 없음                  | 미채택 |
| JSON-LD를 `meta`의 `script:ld+json`(라우터 기능)으로 | 라우터가 이스케이프                           | React 라우터의 head 타입이 허용하지 않아 단언이 필요                      | 미채택 |
| robots.txt를 정적 파일로 두고 Sitemap 줄 생략        | 서버 코드 없음                                | 사이트맵을 수집기가 스스로 찾지 못함(검색 콘솔 수동 등록 필요)            | 미채택 |

## 가정·한계

- 운영 `SITE_URL`이 실제 공개 주소라고 가정한다(ADR-0022와 같음).
- 이미 검색엔진에 남은 noindex 기록은 다시 수집될 때까지 반영되지 않는다. 검색 콘솔 등록·사이트맵 제출은 운영자가 한다.
- llms.txt는 표준이 아닌 제안 형식이다. 지원하지 않는 수집기는 무시한다.
- 폼 정의에 일정·장소가 구조화돼 있지 않아 `Event`는 만들지 않는다. 생기면 별도 결정으로 추가한다.

## 검증

- 단위: `apps/web/test/search.test.ts`(canonical·출처 검사·구조화 데이터·스크립트 인코딩·robots·sitemap·llms.txt).
- E2E: 홈·공개 폼의 index·canonical·JSON-LD, 신청 완료·신청 내역의 noindex, 수집기 파일 3종.
