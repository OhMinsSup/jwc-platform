"use client";

import { Button, cn } from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, MapPin, Sparkles, Users } from "lucide-react";
import { useOnboardingFormStore } from "@/store/onboarding-form-store";

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.12,
			delayChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 24 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			ease: "easeOut" as const,
		},
	},
};

const floatAnimation = {
	y: [-4, 4, -4],
	transition: {
		duration: 4,
		repeat: Number.POSITIVE_INFINITY,
		ease: "easeInOut" as const,
	},
};

const highlights = [
	{ icon: Calendar, text: "2026년 1월 8일", color: "text-blue-500" },
	{ icon: Users, text: "청년부 수련회", color: "text-purple-500" },
	{ icon: MapPin, text: "광림 수도원", color: "text-green-500" },
];

export function WelcomeStep() {
	const navigate = useNavigate();
	const { clearForm, setCurrentStep } = useOnboardingFormStore();

	const handleStart = async () => {
		clearForm();
		setCurrentStep("personal");
		await navigate({ to: "/onboarding/$step", params: { step: "personal" } });
	};

	return (
		<div className="flex flex-col items-center justify-center">
			<motion.div
				animate="visible"
				className="w-full max-w-lg text-center"
				initial="hidden"
				variants={containerVariants}
			>
				{/* 배지 */}
				<motion.div variants={itemVariants}>
					<motion.div
						animate={floatAnimation}
						className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2.5"
					>
						<Sparkles className="h-4 w-4 text-primary" />
						<span className="font-medium text-primary text-sm">
							2026 청년부 겨울 수련회
						</span>
					</motion.div>
				</motion.div>

				{/* 메인 타이틀 */}
				<motion.div className="mb-6" variants={itemVariants}>
					<h1 className="mt-1 font-bold text-4xl tracking-tight md:text-5xl">
						<span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
							멸종위기사랑
						</span>
					</h1>
				</motion.div>

				{/* 서브 타이틀 */}
				<motion.p
					className="mb-8 text-lg text-muted-foreground"
					variants={itemVariants}
				>
					신청서 작성을 시작해주세요
				</motion.p>

				{/* 하이라이트 */}
				<motion.div
					className="mb-10 flex justify-center gap-4"
					variants={itemVariants}
				>
					{highlights.map((item) => (
						<div
							className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/50 px-4 py-2"
							key={item.text}
						>
							<item.icon className={cn("h-4 w-4", item.color)} />
							<span className="text-muted-foreground text-sm">{item.text}</span>
						</div>
					))}
				</motion.div>

				{/* 설명 카드 */}
				<motion.div
					className="mb-8 rounded-2xl border border-border/50 bg-muted/20 p-6"
					variants={itemVariants}
				>
					<p className="text-muted-foreground text-sm leading-relaxed">
						아래 버튼을 눌러 수련회 참가 신청을 시작해주세요.
						<br />
						<span className="font-medium text-foreground">약 3-5분</span> 정도
						소요됩니다.
					</p>
				</motion.div>

				{/* CTA 버튼 */}
				<motion.div variants={itemVariants}>
					<Button
						className={cn(
							"group h-14 rounded-full px-10 font-medium text-base",
							"bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
							"shadow-primary/25 shadow-xl hover:shadow-2xl hover:shadow-primary/30",
							"transition-all duration-300"
						)}
						onClick={handleStart}
						size="lg"
					>
						신청 시작하기
						<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
					</Button>
				</motion.div>

				{/* 문의 */}
				<motion.div
					className="mt-12 text-muted-foreground/60 text-xs"
					variants={itemVariants}
				>
					<p>문의: 청년부 담당자</p>
				</motion.div>
			</motion.div>
		</div>
	);
}

export default WelcomeStep;
