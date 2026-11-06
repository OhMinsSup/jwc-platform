/**
 * 고정 창(fixed window) 요청 수 제한. 규칙은 앱이 표(데이터)로 넘기고, 카운터 저장소는 포트로 주입한다.
 * 대상(IP 등)은 원문 대신 hashSubject 결과로 저장한다.
 */

export interface RateLimitRule {
	max: number;
	windowMs: number;
}

/** 키의 현재 창 횟수를 원자적으로 1 올리고 돌려준다 (창이 지났으면 1부터) */
export interface BucketStore {
	hit: (key: string, now: number, windowMs: number) => Promise<number>;
}

export class RateLimitExceededError extends Error {
	override name = "RateLimitExceededError";
	readonly rule: string;
	constructor(rule: string) {
		super(`rate limit exceeded: ${rule}`);
		this.rule = rule;
	}
}

export interface RateLimiter<R extends string> {
	/** 규칙을 넘었으면 RateLimitExceededError */
	enforce: (rule: R, subject: string, now: number) => Promise<void>;
	/** 가장 긴 창. 이보다 오래된 버킷은 지워도 된다 */
	longestWindowMs: number;
}

export function createRateLimiter<R extends string>(options: {
	hashSubject: (subject: string) => Promise<string>;
	rules: Readonly<Record<R, RateLimitRule>>;
	store: BucketStore;
}): RateLimiter<R> {
	const windows: number[] = Object.values<RateLimitRule>(options.rules).map(
		(rule) => rule.windowMs,
	);
	return {
		longestWindowMs: Math.max(0, ...windows),
		enforce: async (rule, subject, now) => {
			const { max, windowMs } = options.rules[rule];
			const key = `${rule}:${await options.hashSubject(subject)}`;
			const count = await options.store.hit(key, now, windowMs);
			if (count > max) {
				throw new RateLimitExceededError(rule);
			}
		},
	};
}

/** Cloudflare가 붙이는 실제 클라이언트 IP. 헤더가 없으면(로컬 개발) 하나의 버킷으로 묶는다 */
export function clientIpOf(headers: Headers): string {
	return headers.get("cf-connecting-ip") ?? "unknown";
}
