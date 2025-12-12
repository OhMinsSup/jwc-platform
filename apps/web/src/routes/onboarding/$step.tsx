import { Button } from "@jwc/ui";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { lazy, Suspense } from "react";
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
			<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
		<div className="flex min-h-svh flex-col bg-muted/5">
			{/* Navbar */}
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto flex h-16 items-center justify-between px-4">
					<Link
						className="flex items-center gap-2 font-bold text-xl tracking-tight"
						to="/"
					>
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<svg
								className="h-5 w-5"
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<title>JWC Retreat Logo</title>
								<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
							</svg>
						</div>
						<span>JWC Retreat</span>
					</Link>
					<div className="flex items-center gap-4">
						<Button asChild size="sm" variant="ghost">
							<Link to="/">
								<Home className="mr-2 h-4 w-4" />
								홈으로
							</Link>
						</Button>
					</div>
				</div>
			</header>

			{showProgress && (
				<div className="sticky top-16 z-40 border-b bg-background/80 backdrop-blur-sm">
					<div className="container mx-auto max-w-2xl px-4 py-4">
						<StepProgress currentStep={currentStep} />
					</div>
				</div>
			)}

			<main className="flex-1 py-8 md:py-12">
				<div className="container mx-auto max-w-2xl px-4">
					<Suspense fallback={<StepLoader />}>{renderStep()}</Suspense>
				</div>
			</main>
		</div>
	);
}
