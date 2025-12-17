/**
 * SMS 완료 핸들러
 *
 * Workpool의 onComplete 콜백으로 사용되는 mutation들
 * (Node.js 런타임이 아닌 Convex 런타임에서 실행)
 */

import { vOnCompleteArgs } from "@convex-dev/workpool";
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * SMS 발송 완료 후 로깅/처리를 위한 onComplete 핸들러
 */
export const onSmsComplete = internalMutation({
	args: vOnCompleteArgs(
		v.object({
			type: v.string(),
			onboardingId: v.optional(v.id("onboarding")),
		})
	),
	handler: (_ctx, { context, result }) => {
		const timestamp = new Date().toISOString();
		const target = context.onboardingId ?? "unknown";

		if (result.kind === "success") {
			console.log(
				`[SMS Complete] ${context.type} for ${target} succeeded at ${timestamp}`
			);
		} else if (result.kind === "failed") {
			console.error(
				`[SMS Complete] ${context.type} for ${target} failed: ${result.error}`
			);
		} else {
			console.log(`[SMS Complete] ${context.type} for ${target} was canceled`);
		}
	},
});
