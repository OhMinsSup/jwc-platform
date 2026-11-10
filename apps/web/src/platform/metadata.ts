import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE } from "./brand";

const MAX_DESCRIPTION_LENGTH = 160;
const GRAPHEMES = new Intl.Segmenter("ko", { granularity: "grapheme" });

/** 공유 미리보기 이미지 (public/og-image.png, scripts/brand-images.ts가 만든다) */
const SHARE_IMAGE = {
	path: "/og-image.png",
	width: 1200,
	height: 630,
	alt: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
} as const;

/** 설명은 일반 텍스트로 정규화한다. HTML 출력 인코딩은 TanStack HeadContent가 맡는다. */
export function pageMeta({
	title,
	description,
}: {
	title: string;
	description?: string;
}) {
	const pageTitle = `${title} | ${BRAND_NAME}`;
	const normalized = description?.replaceAll(/\s+/gu, " ").trim() ?? "";
	const summary = Array.from(
		GRAPHEMES.segment(normalized.length > 0 ? normalized : BRAND_DESCRIPTION),
		(part) => part.segment,
	)
		.slice(0, MAX_DESCRIPTION_LENGTH)
		.join("");
	return [
		{ title: pageTitle },
		{ name: "description", content: summary },
		{ property: "og:type", content: "website" },
		{ property: "og:site_name", content: BRAND_NAME },
		{ property: "og:locale", content: "ko_KR" },
		{ property: "og:title", content: pageTitle },
		{ property: "og:description", content: summary },
		{ name: "twitter:title", content: pageTitle },
		{ name: "twitter:description", content: summary },
	];
}

/**
 * 공유 카드 메타: 카드 종류와 이미지를 함께 정한다. root에서만 부르며, 하위 화면의 pageMeta는 카드 종류를 두지 않는다.
 * 메신저 수집기는 상대 주소를 읽지 못해 사이트 출처(환경 스키마가 검증한 SITE_URL)로 절대 주소를 만든다.
 * 출처를 모르면(root 로더 실패) 이미지 없는 큰 카드가 되지 않도록 기본 카드만 선언한다.
 */
export function shareCardMeta(origin: string | undefined) {
	if (!origin) {
		return [{ name: "twitter:card", content: "summary" }];
	}
	const image = new URL(SHARE_IMAGE.path, origin).href;
	return [
		{ name: "twitter:card", content: "summary_large_image" },
		{ property: "og:image", content: image },
		{ property: "og:image:type", content: "image/png" },
		{ property: "og:image:width", content: String(SHARE_IMAGE.width) },
		{ property: "og:image:height", content: String(SHARE_IMAGE.height) },
		{ property: "og:image:alt", content: SHARE_IMAGE.alt },
		{ name: "twitter:image", content: image },
		{ name: "twitter:image:alt", content: SHARE_IMAGE.alt },
	];
}
