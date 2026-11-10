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
const WEB_PROTOCOLS = new Set(["http:", "https:"]);

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
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: pageTitle },
		{ name: "twitter:description", content: summary },
	];
}

/**
 * 공유 미리보기 이미지 메타. 메신저 수집기는 상대 주소를 읽지 못해 사이트 출처로 절대 주소를 만든다.
 * 출처가 http(s) 주소가 아니면 잘못된 주소를 내보내지 않도록 비운다.
 */
export function shareImageMeta(origin: string) {
	if (!URL.canParse(origin)) {
		return [];
	}
	const base = new URL(origin);
	if (!WEB_PROTOCOLS.has(base.protocol)) {
		return [];
	}
	const image = new URL(SHARE_IMAGE.path, base.origin).href;
	return [
		{ property: "og:image", content: image },
		{ property: "og:image:type", content: "image/png" },
		{ property: "og:image:width", content: String(SHARE_IMAGE.width) },
		{ property: "og:image:height", content: String(SHARE_IMAGE.height) },
		{ property: "og:image:alt", content: SHARE_IMAGE.alt },
		{ name: "twitter:image", content: image },
		{ name: "twitter:image:alt", content: SHARE_IMAGE.alt },
	];
}
