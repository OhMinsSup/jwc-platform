import { createFileRoute, redirect } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LoadingSpinner, Navbar, PageLayout } from "@/components/common";
import { OnboardingErrorBoundary } from "@/components/onboarding";
import StepProgress from "@/components/onboarding/StepProgress";
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
			<LoadingSpinner />
		</div>
	);
}

function OnboardingStepPage() {
	const { step } = Route.useParams();

	const currentStep = step as StepSlug;

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
		<PageLayout header={<Navbar />}>
			{showProgress && (
				<div className="sticky top-16 z-40 border-b bg-background/80 backdrop-blur-sm">
					<div className="container mx-auto max-w-2xl px-4 py-4">
						<StepProgress currentStep={currentStep} />
					</div>
				</div>
			)}

			<div className="py-8 md:py-12">
				<div className="container mx-auto max-w-2xl px-4">
					<Suspense fallback={<StepLoader />}>{renderStep()}</Suspense>
				</div>
			</div>
		</PageLayout>
	);
}
