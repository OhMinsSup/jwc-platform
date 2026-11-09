# ADR-0015: 공개 폼의 초기 로딩·입력 렌더링·메타데이터

- 상태: 채택
- 작성일: 2026-11-09
- 관련: ADR-0008, ADR-0014

## Problem 1-Pager

- 배경: 공개 폼은 모든 입력 유형의 코드를 정적으로 불러오고, 답변 변경 때마다 새 onChange를 모든 질문에 전달한다. 글꼴 CSS 두 개는 외부 CDN에서 렌더링을 막으며 SUIT에는 font-display도 없다.
- 문제: 날짜 질문이 없는 화면도 달력 코드를 받는다. 독립적인 다른 질문도 다시 렌더링한다. 초기 글꼴 로딩이 본문 표시를 지연시킬 수 있고 공개 화면의 설명 메타데이터가 없다.
- 목표: 조건부 입력 코드를 분리하고, 변경된 질문만 다시 그리며, 외부 글꼴 CSS 요청을 기본 스타일에 합친다. SSR 제목·설명·공유 메타데이터와 검색 비노출을 검증한다.
- 비목표: 검색 등록·사이트맵, 개인정보 화면 캐싱, 서버 저장소 교체, 디자인·폰트 변경, 실제 외부 서비스 연결·운영 배포.
- 제약: Effect를 추가하지 않는다. 날짜 선택기의 키보드·라벨과 조건부 질문·검증을 유지한다. 관리자·완료·신청 내역은 개인정보를 메타데이터에 넣지 않는다.

## 대안

- A: 모든 입력을 미리 불러오고 폼 전체를 메모한다. 장점은 코드가 단순하다는 것이다. 단점은 날짜가 없는 폼에도 달력 전송이 발생하며, 답변 prop이 매번 바뀌어 전체 메모가 효과 없다는 것이다.
- B: 날짜·시간 렌더러를 lazy import하고 질문별 store 구독과 memo 경계를 둔다(채택). 장점은 필요한 코드와 질문만 처리하는 것이다. 단점은 첫 날짜 입력의 청크 요청이 추가되는 것이며, 위험은 로딩 중 레이아웃·포커스 변화이므로 높이를 확보하고 E2E로 확인한다.
- 글꼴 A: 전체 WOFF2 두 개를 내려받아 자체 제공한다. 장점은 CDN 의존성 제거이며 단점은 Wanted Sans의 기존 문자별 분할 다운로드를 잃는 것이다.
- 글꼴 B: 기존 버전의 font-face 선언만 로컬 스타일에 합치고 실제 폰트는 고정 버전 CDN에서 받는다(채택). 장점은 추가 CSS 요청 없이 기존 분할 다운로드를 유지하는 것이다. 단점은 폰트 CDN 의존성이 남는 것이며, 실패 시 swap과 기존 시스템 글꼴로 본문을 표시한다.

## 검색 노출 정책과 영향도

- 사용자 선택: 공개 신청폼까지 noindex 유지. robots.txt의 전체 차단과 기존 robots 메타는 유지한다.
- 공개 화면에 제목·정규화된 설명·Open Graph·Twitter 메타데이터를 제공한다. 개인 신청 내용·토큰·질의 문자열을 공유 메타데이터나 canonical URL로 만들지 않는다.
- 상태 원본·저장 형식·서버 검증을 바꾸지 않는다. 질문의 필수·조건부 표시·오류는 같은 데이터를 사용한다.
- 외부 폰트 선언은 기존 SUIT 2.0.5와 Wanted Sans 1.0.3을 유지한다. Wanted의 unicode-range 92개는 그대로 보존하고 파일 길이 제한에 맞춰 나눠 빌드에서 합친다.

## 측정 기준

- 결정 기준: 날짜가 없는 폼의 정적 JS 의존 경로에서 달력을 제외하고, 200개 질문 중 한 답변 변경 시 독립 질문의 렌더 호출을 제거한다. 실패·빈 출력으로 얻은 감소는 인정하지 않는다.
- 기준 빌드: Node 24, 공개 더미 설정, production build. 정적 import 그래프의 gzip 크기를 비교하며 dynamic import는 따로 둔다. 압축 설정을 고정한 결정적 바이트 수이며 실제 네트워크 전송량이나 속도 향상률로 해석하지 않는다.
- 폰트 요청은 추가 렌더 차단 CSS 수와 font-display를 확인한다. 첫 화면 표시 시간은 네트워크·서버·폰트·캐시 영향을 받으므로 로컬 번들 크기로 Core Web Vitals 개선을 주장하지 않는다.
- 가정: 공개 폼 정의의 필드 객체는 답변 입력으로 바뀌지 않는다. 조건부 질문을 계산하는 폼 컨테이너는 여전히 답변을 구독한다.

## 결과와 한계

측정 원자료: [web-2026-11-09.json](../performance/web-2026-11-09.json). 기존 Effect 정리가 적용된 작업 트리를 기준으로, 이번 최적화 전후 production 산출물을 각각 한 번 생성했다. 정적 바이트 수·렌더 호출 수는 결정적 검사이며 시간 벤치마크가 아니다.

| 항목                                                       | 변경 전       | 변경 후       |
| ---------------------------------------------------------- | ------------- | ------------- |
| 공개 폼 진입 청크의 정적 JS 의존 그래프 (gzip 9)           | 251,491 bytes | 219,095 bytes |
| 홈 진입 청크의 정적 JS 의존 그래프 (gzip 9)                | 162,052 bytes | 162,462 bytes |
| 한 답변 변경 후 독립 입력 렌더러 호출 (200개 질문 fixture) | 200회         | 1회           |
| 문서 head의 외부 폰트 CSS 요청                             | 2개           | 0개           |

- 정적 JS는 각각의 청크를 gzip 9로 압축한 크기의 합이다. 정적 import의 순환·중복은 한 번만 센다. 실제 HTML이 추가로 preload하는 청크·동적 청크·전송 압축·브라우저 캐시는 포함하지 않는다.
- 날짜·시간 질문을 표시하면 분리된 temporal-fields 청크와 의존성이 추가로 필요하다. 날짜가 있는 화면의 전체 다운로드가 같은 비율로 줄었다는 뜻이 아니다.
- 메타데이터 추가로 홈의 정적 JS는 410 bytes 늘었다. 글꼴 선언은 앱 CSS로 이동하므로 앱 CSS 자체는 커진다. 전체 폰트 파일 바이트를 줄인 변경이 아니다. 92개 unicode-range·weight·URL이 원본과 같음을 별도 비교했다.
- 렌더 테스트는 입력 렌더러 경계를 계측한다. 200개 입력과 수정된 답변이 DOM에 남고, 폼 컨테이너도 새 답변을 읽었는지 검사한다. 컨테이너의 조건 계산·store의 구독 통지까지 한 번으로 줄인 것은 아니다.
- Node 24·공개 더미 설정에서 `pnpm verify` 통과 (41개 파일, 테스트 313개), production 빌드 통과. E2E 7개 통과: 날짜 키보드 선택·제출, 필수 검증 실패, SSR 메타·noindex·robots, 조건부 질문 표시·검증, 폰트 CDN 장애, 관리자 인증 성공·거절.
- 실제 사용자 Core Web Vitals·모바일 저속 회선·운영 TTFB는 측정하지 않았다. 기존 Turbo output·CSS sourcemap·NO_COLOR/FORCE_COLOR 경고는 남아 있다.

정적 그래프 크기는 빌드 후 다음 방식으로 재현할 수 있다. 빌드는 공개 더미 설정을 사용한다.

```bash
pnpm -C apps/web with-env:test pnpm -w build
python3 - <<'PY'
import gzip, pathlib, re
root = pathlib.Path('apps/web/.cloudflare/output/v0/workers/default/assets/assets')
for pattern in ['routes-*.js', '_slug-*.js']:
    entry = next(root.glob(pattern))
    seen = set()
    def visit(path):
        if path.name in seen:
            return
        seen.add(path.name)
        for dep in re.findall(r'''(?:from|import)\s*["'](\./[^"']+\.js)["']''', path.read_text()):
            visit(path.parent / dep)
    visit(entry)
    size = sum(len(gzip.compress((root / n).read_bytes(), compresslevel=9, mtime=0)) for n in seen)
    print(entry.name, len(seen), size)
PY
```
