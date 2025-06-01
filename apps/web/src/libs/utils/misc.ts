/**
 * 브라우저에서 DOM을 사용할 수 있는지 확인하는 함수입니다.
 */
export function canUseDOM(): boolean {
	return Boolean(
		typeof window !== "undefined" &&
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-optional-chain
			window.document &&
			// eslint-disable-next-line @typescript-eslint/unbound-method
			window.document.createElement
	);
}

/**
 * 브라우저에서 DOM을 사용할 수 있는지 확인하는 함수입니다.
 */
export const isBrowser = () => canUseDOM();

export type TargetValue<T> = T | undefined | null;

export type TargetType = HTMLElement | Element | Window | Document;

export type BasicTarget<T extends TargetType = Element> =
	| (() => TargetValue<T>)
	| TargetValue<T>
	| React.MutableRefObject<TargetValue<T>>;

/**
 * 타겟 요소를 가져오는 함수입니다.
 * @param target - 타겟 요소
 * @param defaultElement - 기본 요소
 */
export function getTargetElement<T extends TargetType>(
	target: BasicTarget<T>,
	defaultElement?: T
) {
	if (!isBrowser()) {
		return undefined;
	}

	if (!target) {
		return defaultElement;
	}

	let targetElement: TargetValue<T>;

	if (typeof target === "function") {
		targetElement = target();
	} else if ("current" in target) {
		targetElement = target.current;
	} else {
		targetElement = target;
	}

	return targetElement;
}

/**
 * 애니메이션 최적화를 위한 함수입니다.
 * @param callback - 애니메이션 콜백 함수
 */
export function optimizeAnimation(callback: () => void) {
	let ticking = false;

	return () => {
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(() => {
				callback();
				ticking = false;
			});
		}
	};
}

/**
 * 배열에서 지정된 개수만큼의 요소를 가져오는 함수입니다.
 * @param array - 배열
 * @param count - 개수
 */
export const take = <T>(array: T[], count: number) => {
	return array.slice(0, count);
};

// TODO: remove this when we use next/image
export const blurDataURL =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAC+0lEQVR42u3UMQ0AAAjAMFBDgkmsowPSStixrOoJgAPSsADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLMCzDAgwLwLAAwwIwLADDAgwLwLAADAswLADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCzAsAwLMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAjAswLAADAvAsADDAjAsAMMCDAvAsADDMizAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAgxLBsCwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAgwLwLAADAswLADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAAwzIswLAADAswLADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIMy7AAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAv4bAG/iiKwyYh7eQAAAABJRU5ErkJggg==";

/**
 * 헤더에서 도메인 URL을 가져오는 함수입니다.
 * @param headers - Request headers
 */
export function getDomainUrl(headers: Headers) {
	const host = headers.get("X-Forwarded-Host") ?? headers.get("host");
	const protocol = headers.get("X-Forwarded-Proto") ?? "http";
	return {
		host,
		protocol,
		url: host ? `${protocol}://${host}` : null,
	};
}

export const getIdxToText = (idx: number) => {
	switch (idx) {
		case 1:
			return "이름";
		case 2:
			return "연락처";
		case 3:
			return "성별";
		case 4:
			return "부서";
		case 5:
			return "또래";
		case 6:
			return "지원하고 싶은 TF팀";
		case 7:
			return "참석하고 싶은 수련회 일정";
		case 8:
			return "참석 날짜";
		case 9:
			return "참석 시간";
		case 10:
			return "픽업 상세내용";
		case 11:
			return "차량 지원 여부";
		case 12:
			return "차량 지원 상세내용";
		case 13:
			return "회비 납부";
		default:
			return "알수없음";
	}
};

export function formatAttendanceDay(value: unknown) {
	switch (value) {
		case "19":
			return "6월 19일";
		case "20":
			return "6월 20일";
		case "21":
			return "6월 21일";
		case "22":
			return "6월 22일";
		default:
			return value || "";
	}
}

export function formatAttendanceTime(value: unknown) {
	switch (value) {
		case "AM":
			return "오전";
		case "PM":
			return "오후";
		case "EVENING":
			return "저녁";
		default:
			return value || "";
	}
}
