const SITE_NAME = "JWC 청년부";
const DEFAULT_DESCRIPTION =
	"죽전우리교회 청년부 행사 신청과 안내를 확인하세요.";
const MAX_DESCRIPTION_LENGTH = 160;
const GRAPHEMES = new Intl.Segmenter("ko", { granularity: "grapheme" });

/** 설명은 일반 텍스트로 정규화한다. HTML 출력 인코딩은 TanStack HeadContent가 맡는다. */
export function pageMeta({
	title,
	description,
}: {
	title: string;
	description?: string;
}) {
	const pageTitle = `${title} | ${SITE_NAME}`;
	const normalized = description?.replaceAll(/\s+/gu, " ").trim() ?? "";
	const summary = Array.from(
		GRAPHEMES.segment(normalized.length > 0 ? normalized : DEFAULT_DESCRIPTION),
		(part) => part.segment,
	)
		.slice(0, MAX_DESCRIPTION_LENGTH)
		.join("");
	return [
		{ title: pageTitle },
		{ name: "description", content: summary },
		{ property: "og:type", content: "website" },
		{ property: "og:site_name", content: SITE_NAME },
		{ property: "og:locale", content: "ko_KR" },
		{ property: "og:title", content: pageTitle },
		{ property: "og:description", content: summary },
		{ name: "twitter:card", content: "summary" },
		{ name: "twitter:title", content: pageTitle },
		{ name: "twitter:description", content: summary },
	];
}
