import {
	buildCsp,
	privacyHeaders,
	securityHeaders,
	withHeaders,
} from "@jwc/security/headers";
import { clientIpOf, RateLimitExceededError } from "@jwc/security/rate-limit";
import {
	limitRequestBody,
	PayloadTooLargeError,
} from "@jwc/security/request-body";
import { isGuardedMutation, judgeRequest } from "@jwc/security/request-policy";

import { ERROR_CATALOG } from "../errors/catalog";
import { posthogConfig, siteOrigin, turnstileConfig } from "../runtime";
import type { WorkerFetch } from "../telemetry/worker";
import { cspDirectives, PRIVATE_PATHS, requestPolicy } from "./policy";
import { enforceRateLimit } from "./rate-limit";

const PAYLOAD_TOO_LARGE = 413;

/**
 * 워커 fetch 앞단 보안: 정책 표(policy.ts)로 요청을 판정하고, 모든 응답에 보안 헤더를 붙인다.
 */

function jsonError(status: number, message: string): Response {
	return Response.json({ ok: false, message }, { status });
}

async function judge(request: Request): Promise<Response | null> {
	const verdict = judgeRequest(request, requestPolicy(siteOrigin()));
	if (verdict.kind === "reject") {
		return jsonError(verdict.status, verdict.message);
	}
	if (verdict.kind === "rate_limit") {
		try {
			await enforceRateLimit(
				verdict.rule,
				clientIpOf(request.headers),
				Date.now(),
			);
		} catch (error) {
			if (error instanceof RateLimitExceededError) {
				const spec = ERROR_CATALOG.rate_limited;
				return jsonError(spec.status, spec.defaultMessage);
			}
			throw error;
		}
	}
	return null;
}

function responseHeaders(pathname: string): Record<string, string> {
	const csp = buildCsp(
		cspDirectives({
			dev: import.meta.env.DEV,
			posthogHost: posthogConfig()?.host ?? null,
			turnstile: turnstileConfig() !== null,
		}),
	);
	return {
		...securityHeaders(csp),
		...privacyHeaders(pathname, PRIVATE_PATHS),
	};
}

async function dispatch(
	inner: WorkerFetch,
	request: Request,
	env: Parameters<WorkerFetch>[1],
	ctx: Parameters<WorkerFetch>[2],
): Promise<Response> {
	const policy = requestPolicy(siteOrigin());
	try {
		const bounded = isGuardedMutation(request, policy)
			? await limitRequestBody(request, policy.maxBodyBytes)
			: request;
		return await inner(bounded, env, ctx);
	} catch (error) {
		if (error instanceof PayloadTooLargeError) {
			return jsonError(PAYLOAD_TOO_LARGE, error.message);
		}
		throw error;
	}
}

export function secureFetch(inner: WorkerFetch): WorkerFetch {
	return async (request, env, ctx) => {
		const rejected = await judge(request);
		const response = rejected ?? (await dispatch(inner, request, env, ctx));
		return withHeaders(
			response,
			responseHeaders(new URL(request.url).pathname),
		);
	};
}
