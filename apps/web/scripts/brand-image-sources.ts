/**
 * 브랜드 이미지의 원본 문서(순수 함수). 렌더링·파일 쓰기는 brand-images.ts가 맡는다.
 * 모든 래스터 아이콘과 OG 이미지는 public/favicon.svg 한 벌에서 파생한다.
 */

/** 래스터 아이콘 하나: 모서리 반경(0이면 꽉 찬 정사각형)과 접수표 배율 */
export interface IconVariant {
	file: string;
	size: number;
	radius: number;
	scale: number;
}

const FAVICON_RADIUS = 8;
const FAVICON_SCALE = 1.25;
/** maskable 아이콘은 지름 80% 안전 영역에 접수표 모서리가 들어오도록 배율을 낮춘다 */
const MASKABLE_SCALE = 1;
/** iOS가 모서리를 깎으므로 꽉 찬 칸에 약간의 여백만 둔다 */
const APPLE_TOUCH_SCALE = 1.05;

export const RASTER_ICONS: readonly IconVariant[] = [
	{
		file: "icon-192.png",
		size: 192,
		radius: FAVICON_RADIUS,
		scale: FAVICON_SCALE,
	},
	{
		file: "icon-512.png",
		size: 512,
		radius: FAVICON_RADIUS,
		scale: FAVICON_SCALE,
	},
	{
		file: "icon-maskable-512.png",
		size: 512,
		radius: 0,
		scale: MASKABLE_SCALE,
	},
	{
		file: "apple-touch-icon.png",
		size: 180,
		radius: 0,
		scale: APPLE_TOUCH_SCALE,
	},
];

export const ICO_SIZES = [16, 32, 48] as const;

export const OG_IMAGE = {
	file: "og-image.png",
	width: 1200,
	height: 630,
} as const;

const DARK_MEDIA_RULE = /@media[\s\S]*?\}\s*\}/u;

/**
 * favicon.svg에서 다크 규칙을 빼고(래스터는 한 가지 색만 담는다) 반경·배율을 바꾼다.
 * 원본에 기대한 값이 없으면 조용히 틀린 아이콘을 만들지 않도록 실패한다.
 */
export function iconSvg(
	favicon: string,
	variant: Pick<IconVariant, "radius" | "scale" | "size">,
): string {
	const radius = `rx="${FAVICON_RADIUS}"`;
	const scale = `scale(${FAVICON_SCALE})`;
	if (!favicon.includes(radius) || !favicon.includes(scale)) {
		throw new Error("favicon.svg의 rx 또는 scale 값이 예상과 다릅니다");
	}
	return favicon
		.replace(DARK_MEDIA_RULE, "")
		.replace(radius, `rx="${variant.radius}"`)
		.replace(scale, `scale(${variant.scale})`)
		.replace("<svg ", `<svg width="${variant.size}" height="${variant.size}" `);
}

/** PNG 여러 장을 담은 ICO 파일 (PNG 내장 형식, Windows Vista 이후·모든 현대 브라우저 지원) */
export function packIco(
	images: readonly { size: number; png: Uint8Array }[],
): Uint8Array {
	const HEADER = 6;
	const ENTRY = 16;
	const ICON_TYPE = 1;
	const COLOR_PLANES = 1;
	const BITS_PER_PIXEL = 32;
	const total =
		HEADER +
		ENTRY * images.length +
		images.reduce((sum, image) => sum + image.png.length, 0);
	const bytes = new Uint8Array(total);
	const view = new DataView(bytes.buffer);
	view.setUint16(2, ICON_TYPE, true);
	view.setUint16(4, images.length, true);
	let offset = HEADER + ENTRY * images.length;
	for (const [index, image] of images.entries()) {
		const entry = HEADER + ENTRY * index;
		// 256px은 0으로 적는 형식이다
		view.setUint8(entry, image.size % 256);
		view.setUint8(entry + 1, image.size % 256);
		view.setUint16(entry + 4, COLOR_PLANES, true);
		view.setUint16(entry + 6, BITS_PER_PIXEL, true);
		view.setUint32(entry + 8, image.png.length, true);
		view.setUint32(entry + 12, offset, true);
		bytes.set(image.png, offset);
		offset += image.png.length;
	}
	return bytes;
}

const HTML_ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
};

/** 문구는 상수지만 문서에 끼워 넣으므로 HTML로 인코딩한다 */
function escapeHtml(text: string): string {
	return text.replaceAll(/[&<>"]/gu, (char) => HTML_ESCAPES[char] ?? char);
}

export interface OgCopy {
	name: string;
	tagline: string;
	description: string;
}

/**
 * OG 이미지 문서 (1200×630). 앱과 같은 글꼴 선언(fontCss)·토큰 색을 쓴다.
 * 왼쪽은 앱 아이콘·이름·소개, 오른쪽은 접수 완료 표 한 장. 색은 상태(접수 완료 초록)에만 쓴다.
 */
export function ogImageHtml(
	copy: OgCopy,
	icon: string,
	fontCss: string,
): string {
	return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
${fontCss}
* { box-sizing: border-box; margin: 0; }
body { width: ${OG_IMAGE.width}px; height: ${OG_IMAGE.height}px; overflow: hidden; color: #17181c;
  font-family: "SUIT Variable", sans-serif; letter-spacing: -0.015em; word-break: keep-all;
  background: #f9fafd; background-image: linear-gradient(#eeeff2 1px, transparent 1px),
  linear-gradient(90deg, #eeeff2 1px, transparent 1px); background-size: 30px 30px;
  display: flex; align-items: center; justify-content: space-between; padding: 0 96px; }
.copy { max-width: 560px; }
.brand { display: flex; align-items: center; gap: 20px; }
.brand svg { width: 76px; height: 76px; }
.name { font: 800 76px/1 "Wanted Sans Variable", sans-serif; letter-spacing: -0.035em; }
.tagline { margin-top: 44px; font: 700 44px/1.25 "Wanted Sans Variable", sans-serif; letter-spacing: -0.03em; }
.description { margin-top: 18px; font-size: 25px; line-height: 1.5; color: #4d4e51; }
${ticketCss()}
</style></head><body>
<div class="copy">
  <div class="brand">${icon}<span class="name">${escapeHtml(copy.name)}</span></div>
  <p class="tagline">${escapeHtml(copy.tagline)}</p>
  <p class="description">${escapeHtml(copy.description)}</p>
</div>
${ticketHtml()}
</body></html>`;
}

function ticketCss(): string {
	return `.ticket { position: relative; width: 380px; height: 236px; transform: rotate(-6deg);
  display: flex; background: #fff; border: 1px solid #dfe0e3; border-radius: 22px;
  box-shadow: 0 24px 48px -24px rgb(23 24 28 / 0.25); }
.ticket::before, .ticket::after { content: ""; position: absolute; top: 50%; width: 36px; height: 36px;
  margin-top: -18px; border-radius: 50%; background: #f9fafd; border: 1px solid #dfe0e3; }
.ticket::before { left: -19px; clip-path: inset(0 0 0 50%); }
.ticket::after { right: -19px; clip-path: inset(0 50% 0 0); }
.main { flex: 1; padding: 34px 30px; display: flex; flex-direction: column; gap: 14px; }
.badge { align-self: flex-start; padding: 6px 14px; border-radius: 999px; font-size: 18px; font-weight: 700;
  color: #005d3e; background: #effff6; border: 1px solid #00714a33; }
.line { height: 14px; border-radius: 7px; background: #eff0f3; }
.stub { width: 112px; border-left: 3px dashed #dfe0e3; display: grid; place-items: center; }
.check { width: 58px; height: 58px; border-radius: 50%; background: #00714a; display: grid; place-items: center; }`;
}

function ticketHtml(): string {
	return `<div class="ticket" aria-hidden="true">
  <div class="main">
    <span class="badge">접수 완료</span>
    <div class="line" style="width: 88%; margin-top: 10px"></div>
    <div class="line" style="width: 64%"></div>
    <div class="line" style="width: 40%"></div>
  </div>
  <div class="stub"><span class="check"><svg width="30" height="30" viewBox="0 0 24 24" fill="none">
    <path d="m5 12.5 4.5 4.5L19 7.5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg></span></div>
</div>`;
}
