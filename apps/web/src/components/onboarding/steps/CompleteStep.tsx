"use client";

import { FEES } from "@jwc/backend/convex/lib/constants";
import { STAY_TYPE_LABELS } from "@jwc/schema";
import { Button, cn } from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
	Bell,
	Calendar,
	Check,
	CheckCircle2,
	Copy,
	CreditCard,
	Home,
	PartyPopper,
} from "lucide-react";
import { useState, useTransition } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import { useOnboardingFormStore } from "@/store/onboarding-form-store";

const formVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1, delayChildren: 0.3 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: "easeOut" as const },
	},
};

const nextSteps = [
	{
		icon: CreditCard,
		title: "참가비 입금",
		description: "안내된 계좌로 참가비를 입금해주세요",
	},
	{
		icon: Bell,
		title: "입금 확인",
		description: "입금 확인 후 최종 신청이 완료됩니다",
	},
	{
		icon: Calendar,
		title: "수련회 참가",
		description: "세부 일정은 추후 공지해드리겠습니다",
	},
];

export function CompleteStep() {
	const navigate = useNavigate();
	const { personalInfo, attendanceInfo, clearForm } = useOnboardingFormStore();
	const { width, height } = useWindowSize();
	const [, startTransition] = useTransition();
	const [isCopied, setIsCopied] = useState(false);

	console.log("FEES:", attendanceInfo); // Debug log to verify FEES import
	const fee = attendanceInfo.stayType ? FEES[attendanceInfo.stayType] : 0;
	const accountInfo =
		import.meta.env.VITE_PAID_ACCOUNT_NUMBER || "계좌 정보 없음";

	const handleGoHome = () => {
		startTransition(() => {
			clearForm();
			navigate({ to: "/" });
		});
	};

	const handleCopyAccount = () => {
		if (!accountInfo) {
			return;
		}
		navigator.clipboard.writeText(accountInfo);
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
	};

	return (
		<>
			<Confetti
				colors={["#8B5CF6", "#EC4899", "#06B6D4", "#10B981", "#F59E0B"]}
				gravity={0.2}
				height={height}
				numberOfPieces={150}
				recycle={false}
				width={width}
			/>

			<div className="mx-auto w-full max-w-xl">
				<motion.div
					animate="visible"
					className="flex flex-col items-center text-center"
					initial="hidden"
					variants={formVariants}
				>
					{/* 성공 아이콘 */}
					<motion.div className="relative mb-8" variants={itemVariants}>
						<motion.div
							animate={{ scale: 1 }}
							className="relative"
							initial={{ scale: 0 }}
							transition={{
								delay: 0.2,
								type: "spring",
								stiffness: 200,
								damping: 15,
							}}
						>
							<div className="flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-green-400 to-green-600 shadow-green-500/30 shadow-lg">
								<CheckCircle2 className="h-14 w-14 text-white" />
							</div>
							<motion.div
								animate={{ scale: 1, rotate: 0 }}
								className="absolute -top-3 -right-3"
								initial={{ scale: 0, rotate: -30 }}
								transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-500 shadow-amber-500/30 shadow-lg">
									<PartyPopper className="h-6 w-6 text-white" />
								</div>
							</motion.div>
						</motion.div>
					</motion.div>

					{/* 타이틀 */}
					<motion.div className="mb-8" variants={itemVariants}>
						<h1 className="mb-3 font-bold text-3xl text-foreground md:text-4xl">
							신청 완료!
						</h1>
						<p className="text-lg text-muted-foreground">
							<span className="font-medium text-primary">
								{personalInfo.name || "신청자"}
							</span>
							님의 수련회 신청이 접수되었습니다
						</p>
					</motion.div>

					{/* 참가비 안내 카드 */}
					<motion.div
						className="mb-8 w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/20"
						variants={itemVariants}
					>
						<div className="border-border/30 border-b bg-muted/30 px-6 py-4">
							<h3 className="font-semibold text-foreground">참가비 안내</h3>
						</div>
						<div className="space-y-4 p-6">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">참가 일정</span>
								<span className="font-medium">
									{attendanceInfo.stayType
										? STAY_TYPE_LABELS[attendanceInfo.stayType]
										: "-"}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">참가비</span>
								<span className="font-bold text-lg text-primary">
									{fee?.toLocaleString()}원
								</span>
							</div>
							<div className="border-border/30 border-t pt-4">
								<div className="mb-2 text-muted-foreground text-sm">
									입금 계좌
								</div>
								<div className="flex items-center justify-between rounded-lg border border-border/50 bg-background p-3">
									<span className="font-medium font-mono">{accountInfo}</span>
									<Button
										className="h-8 w-8 text-muted-foreground hover:text-foreground"
										onClick={handleCopyAccount}
										size="icon"
										variant="ghost"
									>
										{isCopied ? (
											<Check className="h-4 w-4 text-green-500" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>
						</div>
					</motion.div>

					{/* 다음 단계 카드 */}
					<motion.div
						className="mb-8 w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/20"
						variants={itemVariants}
					>
						<div className="border-border/30 border-b bg-muted/30 px-6 py-4">
							<h3 className="font-semibold text-foreground">다음 단계</h3>
						</div>
						<div className="space-y-4 p-4">
							{nextSteps.map((step, index) => (
								<motion.div
									animate={{ opacity: 1, x: 0 }}
									className="flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-muted/50"
									initial={{ opacity: 0, x: -20 }}
									key={step.title}
									transition={{ delay: 0.6 + index * 0.1 }}
								>
									<div
										className={cn(
											"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
											index === 0
												? "bg-primary/10 text-primary"
												: // biome-ignore lint/style/noNestedTernary: <explanation> It's more readable this way.</explanation>
													index === 1
													? "bg-amber-500/10 text-amber-500"
													: "bg-green-500/10 text-green-500"
										)}
									>
										<step.icon className="h-5 w-5" />
									</div>
									<div className="text-left">
										<div className="font-medium text-foreground">
											{step.title}
										</div>
										<div className="text-muted-foreground text-sm">
											{step.description}
										</div>
									</div>
								</motion.div>
							))}
						</div>
					</motion.div>

					{/* 안내 메시지 */}
					<motion.div
						className="mb-8 w-full rounded-xl border border-primary/20 bg-primary/5 p-4"
						variants={itemVariants}
					>
						<p className="text-muted-foreground text-sm">
							입금 확인 및 세부 안내는 등록하신 연락처로 문자로
							안내드리겠습니다.
						</p>
					</motion.div>

					{/* 홈 버튼 */}
					<motion.div variants={itemVariants}>
						<Button
							className={cn(
								"h-12 rounded-xl px-8 font-medium shadow-lg transition-all duration-200",
								"bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
								"text-primary-foreground shadow-primary/20"
							)}
							onClick={handleGoHome}
						>
							<Home className="mr-2 h-4 w-4" />
							홈으로 돌아가기
						</Button>
					</motion.div>
				</motion.div>
			</div>
		</>
	);
}

export default CompleteStep;
