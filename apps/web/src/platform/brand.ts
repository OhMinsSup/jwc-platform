/**
 * 서비스 이름과 소개 문장. 공개·관리자 화면의 머리/바닥, 탭 제목, 공유 메타, 웹 앱 manifest가 이 값을 쓴다.
 * 이름은 아이콘(체크가 찍힌 접수표 = 통과한 신청)에서 따왔다: form + pass.
 * public/site.webmanifest는 정적 파일이라 이름을 직접 적는다 (test/brand-assets.test.ts가 일치를 확인).
 */
export const BRAND_NAME = "Formpass";

/** 머리·바닥에 붙는 한 줄 소개 */
export const BRAND_TAGLINE = "신청 폼부터 접수 안내까지";

/** 페이지별 설명이 없을 때 쓰는 기본 설명 (공유 미리보기) */
export const BRAND_DESCRIPTION =
	"신청 폼을 만들고 접수와 안내 문자까지 한 곳에서 처리하는 신청 폼 서비스입니다.";

/**
 * 화면 바탕(styles.css의 --background) 라이트/다크 값. meta theme-color·manifest·OG 이미지가 쓴다.
 * meta 태그는 CSS 변수를 읽지 못해 값으로 둔다 (test/brand-assets.test.ts가 styles.css와 일치를 확인).
 */
export const BRAND_THEME_COLORS = {
	light: "#f9fafd",
	dark: "#0a0b0e",
} as const;
