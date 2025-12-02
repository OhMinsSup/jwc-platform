import { expo } from "@better-auth/expo";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

export const authComponent = createClient<DataModel>(components.betterAuth);

/**
 * 사이트 URL을 가져옵니다.
 * - 환경 변수가 없으면 기본값 사용 (개발 환경)
 */
function getSiteURL(): string {
	// Convex 환경에서는 process.env가 런타임에만 작동
	// 모듈 분석 시점에서는 기본값 반환
	return process.env.CONVEX_SITE_URL ?? "http://localhost:3000";
}

function createAuth(
	ctx: GenericCtx<DataModel>,
	{ optionsOnly }: { optionsOnly?: boolean } = { optionsOnly: false }
) {
	const siteURL = getSiteURL();

	return betterAuth({
		logger: {
			disabled: optionsOnly,
		},
		baseURL: siteURL,
		trustedOrigins: [siteURL],
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		plugins: [expo(), convex()],
	});
}

export { createAuth };
