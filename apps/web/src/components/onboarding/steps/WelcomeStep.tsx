import { Button } from "@jwc/ui";
import { motion } from "framer-motion";
import { ArrowRight, Church } from "lucide-react";
import { useOnboardingFormStore } from "@/store/onboarding-form-store";

interface WelcomeStepProps {
	onNext: () => void;
}

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.2,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
		},
	},
};

export function WelcomeStep({ onNext }: WelcomeStepProps) {
	const { resetForm } = useOnboardingFormStore();

	const handleStart = () => {
		resetForm();
		onNext();
	};

	return (
		<motion.div
			animate="visible"
			className="flex min-h-[60vh] flex-col items-center justify-center text-center"
			initial="hidden"
			variants={containerVariants}
		>
			<motion.div className="mb-8" variants={itemVariants}>
				<div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
					<Church className="h-12 w-12 text-primary" />
				</div>
			</motion.div>

			<motion.h1
				className="mb-4 font-bold text-3xl tracking-tight"
				variants={itemVariants}
			>
				2025 청년부 수련회
			</motion.h1>

			<motion.p
				className="mb-2 text-muted-foreground text-xl"
				variants={itemVariants}
			>
				신청서 작성
			</motion.p>

			<motion.p
				className="mb-8 max-w-md text-muted-foreground text-sm"
				variants={itemVariants}
			>
				아래 버튼을 눌러 수련회 참가 신청을 시작해주세요.
				<br />약 3-5분 정도 소요됩니다.
			</motion.p>

			<motion.div variants={itemVariants}>
				<Button className="gap-2" onClick={handleStart} size="lg">
					신청 시작하기
					<ArrowRight className="h-5 w-5" />
				</Button>
			</motion.div>

			<motion.div
				className="mt-12 text-muted-foreground text-xs"
				variants={itemVariants}
			>
				<p>문의: 청년부 담당자</p>
			</motion.div>
		</motion.div>
	);
}

export default WelcomeStep;
