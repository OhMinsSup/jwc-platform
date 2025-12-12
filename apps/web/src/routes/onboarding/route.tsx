import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod/v4";
import { OnboardingErrorBoundary } from "@/components/onboarding/OnboardingErrorBoundary";

const onboardingSearchSchema = z.object({
	/** 전화번호 해시 - draft 조회 및 저장에 사용 */
	phoneHash: z.string().optional(),
});

export type OnboardingSearchParams = z.infer<typeof onboardingSearchSchema>;

export const Route = createFileRoute("/onboarding")({
	validateSearch: onboardingSearchSchema,
	beforeLoad: ({ location }) => {
		// /onboarding 접근 시 /onboarding/welcome으로 리다이렉트
		if (
			location.pathname === "/onboarding" ||
			location.pathname === "/onboarding/"
		) {
			throw redirect({ to: "/onboarding/$step", params: { step: "welcome" } });
		}
	},
	head: () => ({
		meta: [
			{
				title: "수련회 신청하기 - 2026 동계 청년부 수련회",
			},
			{
				property: "og:title",
				content: "수련회 신청하기 - 2026 동계 청년부 수련회",
			},
		],
	}),
	component: OnboardingLayout,
	errorComponent: OnboardingErrorBoundary,
});

function OnboardingLayout() {
	return <Outlet />;
}
