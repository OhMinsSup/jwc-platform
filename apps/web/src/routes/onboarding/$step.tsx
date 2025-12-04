import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef } from "react";
import { OnboardingErrorBoundary } from "@/components/onboarding/OnboardingErrorBoundary";
import {
	getNextStep,
	getPrevStep,
	isValidStep,
	type StepSlug,
} from "@/lib/onboarding-form-store";
import { useOnboardingDraft } from "@/lib/use-onboarding-draft";
import type { OnboardingSearchParams } from "./route";

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
const PaymentInfoStep = lazy(
	() => import("@/components/onboarding/steps/PaymentInfoStep")
);
const ConfirmStep = lazy(
	() => import("@/components/onboarding/steps/ConfirmStep")
);
const CompletedStep = lazy(
	() => import("@/components/onboarding/steps/CompletedStep")
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
	const navigate = useNavigate();

	const currentStep = step as StepSlug;
	const phoneHash = search.phoneHash ?? null;

	// Draft 관련 훅 - phoneHash를 직접 전달
	const { hasDraft, isDraftReady, saveDraftImmediately, hydrateFormFromDraft } =
		useOnboardingDraft(phoneHash);

	// Draft 로드 상태 추적
	const hasHydratedRef = useRef(false);

	// Draft 데이터가 있으면 폼에 적용 (최초 1회)
	useEffect(() => {
		if (isDraftReady && hasDraft && !hasHydratedRef.current) {
			hydrateFormFromDraft();
			hasHydratedRef.current = true;
		}
	}, [isDraftReady, hasDraft, hydrateFormFromDraft]);

	// 다음 스텝으로 이동 (search params 유지, draft 저장)
	const goToNextStep = async (newSearch?: Partial<OnboardingSearchParams>) => {
		const nextStep = getNextStep(currentStep);
		if (nextStep) {
			// phoneHash가 있으면 draft 저장
			const hash = phoneHash || newSearch?.phoneHash;
			if (hash) {
				await saveDraftImmediately(currentStep);
			}
			navigate({
				to: "/onboarding/$step",
				params: { step: nextStep },
				search: { ...search, ...newSearch },
			});
		}
	};

	// 이전 스텝으로 이동 (search params 유지)
	const goToPrevStep = () => {
		const prevStep = getPrevStep(currentStep);
		if (prevStep) {
			navigate({
				to: "/onboarding/$step",
				params: { step: prevStep },
				search,
			});
		}
	};

	const renderStep = () => {
		switch (currentStep) {
			case "welcome":
				return <WelcomeStep onNext={goToNextStep} />;
			case "personal-info":
				return <PersonalInfoStep onNext={goToNextStep} />;
			case "attendance-info":
				return <AttendanceInfoStep onNext={goToNextStep} />;
			case "support-info":
				return <SupportInfoStep onNext={goToNextStep} />;
			case "additional-info":
				return <AdditionalInfoStep onNext={goToNextStep} />;
			case "payment-info":
				return <PaymentInfoStep onNext={goToNextStep} />;
			case "confirm":
				return <ConfirmStep onNext={goToNextStep} onPrev={goToPrevStep} />;
			case "completed":
				return <CompletedStep />;
			default:
				return <WelcomeStep onNext={goToNextStep} />;
		}
	};

	return <Suspense fallback={<StepLoader />}>{renderStep()}</Suspense>;
}
