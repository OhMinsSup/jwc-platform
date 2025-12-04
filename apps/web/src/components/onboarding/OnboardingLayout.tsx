import { Button, Progress } from "@jwc/ui";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Github, Home } from "lucide-react";
import type React from "react";
import {
	STEP_CONFIG,
	STEP_LABELS,
	useOnboardingFormStore,
} from "@/lib/onboarding-form-store";

// ============================================================
// Progress Header
// ============================================================

function ProgressHeader() {
	const { currentStep } = useOnboardingFormStore();

	// Welcome(0), Confirm(6), Completed(7) 스텝에서는 진행률 표시 안함
	if (
		currentStep === STEP_CONFIG.WELCOME ||
		currentStep >= STEP_CONFIG.CONFIRM
	) {
		return null;
	}

	// 진행률: 1~5 스텝 기준
	const formSteps = STEP_CONFIG.CONFIRM - 1; // 6-1 = 5 (폼 스텝 수)
	const progress = (currentStep / formSteps) * 100;

	return (
		<div className="fixed top-0 right-0 left-0 z-50">
			<Progress className="h-1 rounded-none" value={progress} />
		</div>
	);
}

// ============================================================
// Navigation Header
// ============================================================

function NavigationHeader() {
	const navigate = useNavigate();
	const { currentStep, prevStep } = useOnboardingFormStore();

	const handleBack = () => {
		if (currentStep > 0) {
			prevStep();
			navigate({ to: "/onboarding" });
		}
	};

	// 폼 스텝 수 (Welcome, Confirm, Completed 제외)
	const formStepCount = STEP_CONFIG.CONFIRM - 1;

	return (
		<header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex items-center gap-2">
				{currentStep > 0 && currentStep < STEP_CONFIG.CONFIRM ? (
					<Button onClick={handleBack} size="icon" variant="ghost">
						<ArrowLeft className="h-5 w-5" />
					</Button>
				) : (
					<Link to="/">
						<Button size="icon" variant="ghost">
							<Home className="h-5 w-5" />
						</Button>
					</Link>
				)}
			</div>

			<div className="flex items-center gap-2">
				<span className="text-muted-foreground text-sm">
					{currentStep > 0 && currentStep < STEP_CONFIG.CONFIRM
						? `${STEP_LABELS[currentStep]} (${currentStep}/${formStepCount})`
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

// ============================================================
// Layout
// ============================================================

interface OnboardingLayoutProps {
	children?: React.ReactNode;
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
	return (
		<>
			<ProgressHeader />
			<NavigationHeader />
			<main className="container mx-auto max-w-2xl px-4 py-8">
				{children ?? <Outlet />}
			</main>
		</>
	);
}
