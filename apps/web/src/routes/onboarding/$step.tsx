import { createFileRoute, redirect } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useTransition } from "react";
import { OnboardingErrorBoundary } from "@/components/onboarding";
import StepProgress from "@/components/onboarding/StepProgress";
import { useOnboardingDraft } from "@/hooks/use-onboarding-draft";
import { isValidStep, type StepSlug } from "@/store/onboarding-form-store";

// Lazy load step components
const WelcomeStep = lazy(
	() => import("@/components/onboarding/steps/WelcomeStep")
);
const PersonalInfoStep = lazy(
	() => import("@/components/onboarding/steps/PersonalInfoStep")
);
const AttendanceInfoStep = lazy(
	() => import("@/components/onboarding/steps/AttendanceInfoStep")
);
const SupportInfoStep = lazy(
	() => import("@/components/onboarding/steps/SupportInfoStep")
);
const AdditionalInfoStep = lazy(
	() => import("@/components/onboarding/steps/AdditionalInfoStep")
);
const ConfirmStep = lazy(
	() => import("@/components/onboarding/steps/ConfirmStep")
);
const CompleteStep = lazy(
	() => import("@/components/onboarding/steps/CompleteStep")
);

export const Route = createFileRoute("/onboarding/$step")({
	beforeLoad: ({ params }) => {
		// 유효하지 않은 스텝이면 welcome으로 리다이렉트
		if (!isValidStep(params.step)) {
			throw redirect({ to: "/onboarding/$step", params: { step: "welcome" } });
		}
	},
	component: OnboardingStepPage,
	errorComponent: OnboardingErrorBoundary,
});

function StepLoader() {
	return (
		<div className="flex min-h-[400px] items-center justify-center">
			<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
		</div>
	);
}

function OnboardingStepPage() {
	const { step } = Route.useParams();
	const search = Route.useSearch();

	const currentStep = step as StepSlug;
	const phoneHash = (search as { phoneHash?: string }).phoneHash ?? null;

	// Draft 관련 훅 - phoneHash를 직접 전달
	const { hasDraft, isDraftReady, hydrateFormFromDraft } =
		useOnboardingDraft(phoneHash);

	// Transition for async operations
	const [, startTransition] = useTransition();

	// Draft 로드 상태 추적
	const hasHydratedRef = useRef(false);

	// Draft 데이터가 있으면 폼에 적용 (최초 1회)
	useEffect(() => {
		if (isDraftReady && hasDraft && !hasHydratedRef.current) {
			hasHydratedRef.current = true;
			startTransition(() => {
				hydrateFormFromDraft().catch(console.error);
			});
		}
	}, [isDraftReady, hasDraft, hydrateFormFromDraft]);

	// 진행 상황 표시 여부 (welcome, complete 제외)
	const showProgress = !["welcome", "complete"].includes(currentStep);

	const renderStep = () => {
		switch (currentStep) {
			case "welcome":
				return <WelcomeStep />;
			case "personal":
				return <PersonalInfoStep />;
			case "attendance":
				return <AttendanceInfoStep />;
			case "support":
				return <SupportInfoStep />;
			case "additional":
				return <AdditionalInfoStep />;
			case "confirm":
				return <ConfirmStep />;
			case "complete":
				return <CompleteStep />;
			default:
				return <WelcomeStep />;
		}
	};

	return (
		<div className="min-h-screen bg-background">
			{showProgress && (
				<div className="sticky top-0 z-10 border-border/50 border-b bg-background/80 backdrop-blur-sm">
					<div className="mx-auto max-w-xl px-4 py-4">
						<StepProgress currentStep={currentStep} />
					</div>
				</div>
			)}
			<Suspense fallback={<StepLoader />}>{renderStep()}</Suspense>
		</div>
	);
}
