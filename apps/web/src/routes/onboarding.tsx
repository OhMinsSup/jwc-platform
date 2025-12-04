import { createFileRoute } from "@tanstack/react-router";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { AdditionalInfoStep } from "@/components/onboarding/steps/AdditionalInfoStep";
import { AttendanceInfoStep } from "@/components/onboarding/steps/AttendanceInfoStep";
import { CompletedStep } from "@/components/onboarding/steps/CompletedStep";
import { ConfirmStep } from "@/components/onboarding/steps/ConfirmStep";
import { PaymentInfoStep } from "@/components/onboarding/steps/PaymentInfoStep";
import { PersonalInfoStep } from "@/components/onboarding/steps/PersonalInfoStep";
import { SupportInfoStep } from "@/components/onboarding/steps/SupportInfoStep";
import { WelcomeStep } from "@/components/onboarding/steps/WelcomeStep";
import {
	STEP_CONFIG,
	useOnboardingFormStore,
} from "@/lib/onboarding-form-store";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingFormPage,
});

function OnboardingFormPage() {
	const { currentStep } = useOnboardingFormStore();

	const renderStep = () => {
		switch (currentStep) {
			case STEP_CONFIG.WELCOME:
				return <WelcomeStep />;
			case STEP_CONFIG.PERSONAL_INFO:
				return <PersonalInfoStep />;
			case STEP_CONFIG.ATTENDANCE_INFO:
				return <AttendanceInfoStep />;
			case STEP_CONFIG.SUPPORT_INFO:
				return <SupportInfoStep />;
			case STEP_CONFIG.ADDITIONAL_INFO:
				return <AdditionalInfoStep />;
			case STEP_CONFIG.PAYMENT_INFO:
				return <PaymentInfoStep />;
			case STEP_CONFIG.CONFIRM:
				return <ConfirmStep />;
			case STEP_CONFIG.COMPLETED:
				return <CompletedStep />;
			default:
				return <WelcomeStep />;
		}
	}

	return <OnboardingLayout>{renderStep()}</OnboardingLayout>;
}
