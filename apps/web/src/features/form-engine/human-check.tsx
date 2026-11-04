import { getRouteApi } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile(봇 방지) 위젯. 사이트 키가 설정된 경우에만 그린다.
 * 토큰은 1회용이라 제출이 실패하면 reset으로 위젯을 새로 만든다.
 */

const SCRIPT_URL =
	"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
	remove: (widgetId: string) => void;
	render: (
		container: HTMLElement,
		options: {
			sitekey: string;
			callback: (token: string) => void;
			"expired-callback": () => void;
			"error-callback": () => void;
		},
	) => string;
}

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

let scriptLoading: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
	// oxlint-disable-next-line promise/avoid-new -- 스크립트 load/error 이벤트(콜백 API)를 Promise로 바꾸는 유일한 곳
	scriptLoading ??= new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = SCRIPT_URL;
		script.async = true;
		script.addEventListener("load", () => {
			if (window.turnstile) {
				resolve(window.turnstile);
			} else {
				reject(new Error("Turnstile 스크립트를 불러오지 못했습니다"));
			}
		});
		script.addEventListener("error", () => {
			reject(new Error("Turnstile 스크립트를 불러오지 못했습니다"));
		});
		// oxlint-disable-next-line unicorn/prefer-modern-dom-apis -- 앱 tsconfig가 Workers 타입을 함께 읽어 Element.append가 HTMLRewriter 시그니처로 잡힌다 (DOM 노드를 넣을 수 없음)
		document.head.insertAdjacentElement("beforeend", script);
	});
	return scriptLoading;
}

const rootApi = getRouteApi("__root__");

function TurnstileWidget({
	siteKey,
	onToken,
}: {
	siteKey: string;
	onToken: (token: string | null) => void;
}) {
	const container = useRef<HTMLDivElement>(null);
	useEffect(() => {
		let widgetId: string | null = null;
		let cancelled = false;
		const mount = async () => {
			const api = await loadTurnstile();
			if (cancelled || !container.current) {
				return;
			}
			widgetId = api.render(container.current, {
				sitekey: siteKey,
				callback: (token) => {
					onToken(token);
				},
				"expired-callback": () => {
					onToken(null);
				},
				"error-callback": () => {
					onToken(null);
				},
			});
		};
		void mount();
		return () => {
			cancelled = true;
			if (widgetId !== null) {
				window.turnstile?.remove(widgetId);
			}
		};
	}, [siteKey, onToken]);
	return <div className="min-h-16" ref={container} />;
}

export interface HumanCheck {
	/** 제출 가능 여부: 위젯이 없거나 토큰을 받았으면 true */
	ready: boolean;
	/** 제출 실패 후 새 토큰을 받도록 위젯을 다시 만든다 */
	reset: () => void;
	token: string | undefined;
	widget: React.ReactNode;
}

/** 확인 단계에서 쓰는 봇 방지 상태. 미리보기(관리자)에서는 끈다 */
export function useHumanCheck(enabled: boolean): HumanCheck {
	const { turnstileSiteKey } = rootApi.useLoaderData();
	const [token, setToken] = useState<string | null>(null);
	const [generation, setGeneration] = useState(0);
	const siteKey = enabled ? turnstileSiteKey : null;
	if (!siteKey) {
		return {
			ready: true,
			token: undefined,
			reset: () => {
				// 위젯이 없으면 다시 만들 것이 없다
			},
			widget: null,
		};
	}
	return {
		ready: token !== null,
		token: token ?? undefined,
		reset: () => {
			setToken(null);
			setGeneration((value) => value + 1);
		},
		widget: (
			<TurnstileWidget key={generation} onToken={setToken} siteKey={siteKey} />
		),
	};
}
