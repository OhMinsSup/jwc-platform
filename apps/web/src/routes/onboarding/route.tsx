import { Button, Progress } from "@jwc/ui";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft, Github, Home } from "lucide-react";
import { z } from "zod/v4";
import { OnboardingErrorBoundary } from "@/components/onboarding/OnboardingErrorBoundary";
import {
	getPrevStep,
	getStepIndex,
	isValidStep,
	STEP_LABELS,
	type StepSlug,
} from "@/store/onboarding-form-store";

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
	component: OnboardingLayout,
	errorComponent: OnboardingErrorBoundary,
});

function OnboardingLayout() {
	return (
		<>
			<ProgressHeader />
			<NavigationHeader />
			<main className="container mx-auto max-w-2xl px-4 py-8">
				<Outlet />
			</main>
		</>
	);
}

function ProgressHeader() {
	const { step } = Route.useParams() as { step?: string };

	if (!(step && isValidStep(step))) {
		return null;
	}

	const currentIndex = getStepIndex(step);

	// Welcome(0), Confirm(6), Completed(7) 스텝에서는 진행률 표시 안함
	if (currentIndex === 0 || currentIndex >= 6) {
		return null;
	}

	// 진행률: 1~5 스텝 기준 (PERSONAL_INFO ~ PAYMENT_INFO)
	const formSteps = 5; // 폼 스텝 수
	const progress = (currentIndex / formSteps) * 100;

	return (
		<div className="fixed top-0 right-0 left-0 z-50">
			<Progress className="h-1 rounded-none" value={progress} />
		</div>
	);
}

function NavigationHeader() {
	const navigate = useNavigate();
	const { step } = Route.useParams() as { step?: string };

	const currentStep =
		step && isValidStep(step) ? (step as StepSlug) : "welcome";
	const currentIndex = getStepIndex(currentStep);
	const prevStep = getPrevStep(currentStep);

	const handleBack = () => {
		if (prevStep) {
			navigate({ to: "/onboarding/$step", params: { step: prevStep } });
		}
	};

	// 폼 스텝 수 (Welcome, Confirm, Completed 제외)
	const formStepCount = 5;

	return (
		<header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex items-center gap-2">
				{currentIndex > 0 && currentIndex < 6 ? (
					<Button onClick={handleBack} size="icon" variant="ghost">
						<ArrowLeft className="h-5 w-5" />
					</Button>
				) : (
					<Link to="/onboarding">
						<Button size="icon" variant="ghost">
							<Home className="h-5 w-5" />
						</Button>
					</Link>
				)}
			</div>

			<div className="flex items-center gap-2">
				<span className="text-muted-foreground text-sm">
					{currentIndex > 0 && currentIndex < 6
						? `${STEP_LABELS[currentStep]} (${currentIndex}/${formStepCount})`
						: "수련회 신청"}
				</span>
			</div>

			<div className="flex items-center gap-2">
				<a
					href="https://github.com/OhMinsSup/jwc-form"
					rel="noopener noreferrer"
					target="_blank"
				>
					<Button size="icon" variant="ghost">
						<Github className="h-5 w-5" />
					</Button>
				</a>
			</div>
		</header>
	);
}
