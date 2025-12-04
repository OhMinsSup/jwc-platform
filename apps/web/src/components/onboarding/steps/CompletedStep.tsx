import { Button } from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Home, PartyPopper } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { useOnboardingFormStore } from "@/lib/onboarding-form-store";

export function CompletedStep() {
	const navigate = useNavigate();
	const { formData, resetForm } = useOnboardingFormStore();
	const { width, height } = useWindowSize();

	const handleGoHome = () => {
		resetForm();
		navigate({ to: "/" });
	};

	return (
		<>
			<Confetti
				gravity={0.3}
				height={height}
				numberOfPieces={200}
				recycle={false}
				width={width}
			/>

			<motion.div
				animate={{ opacity: 1, scale: 1 }}
				className="flex flex-col items-center py-12 text-center"
				initial={{ opacity: 0, scale: 0.9 }}
				transition={{ duration: 0.5 }}
			>
				<motion.div
					animate={{ scale: 1 }}
					className="relative mb-6"
					initial={{ scale: 0 }}
					transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
				>
					<div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
						<CheckCircle2 className="h-12 w-12 text-green-500" />
					</div>
					<motion.div
						animate={{ scale: 1 }}
						className="-right-2 -top-2 absolute"
						initial={{ scale: 0 }}
						transition={{ delay: 0.5, type: "spring" }}
					>
						<PartyPopper className="h-8 w-8 text-amber-500" />
					</motion.div>
				</motion.div>

				<motion.h2
					animate={{ opacity: 1, y: 0 }}
					className="mb-2 font-bold text-3xl"
					initial={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.3 }}
				>
					신청이 완료되었습니다!
				</motion.h2>

				<motion.p
					animate={{ opacity: 1, y: 0 }}
					className="mb-8 text-muted-foreground"
					initial={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.4 }}
				>
					{formData.name}님의 수련회 신청이 접수되었습니다.
				</motion.p>

				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className="w-full max-w-md space-y-4 rounded-lg border bg-muted/30 p-6"
					initial={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.5 }}
				>
					<h3 className="font-medium">다음 단계</h3>
					<ul className="space-y-3 text-left text-sm">
						<li className="flex items-start gap-3">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
								1
							</div>
							<div>
								<p className="font-medium">참가비 입금</p>
								<p className="text-muted-foreground">
									안내된 계좌로 참가비를 입금해주세요.
								</p>
							</div>
						</li>
						<li className="flex items-start gap-3">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
								2
							</div>
							<div>
								<p className="font-medium">입금 확인</p>
								<p className="text-muted-foreground">
									입금 확인 후 최종 신청이 완료됩니다.
								</p>
							</div>
						</li>
						<li className="flex items-start gap-3">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
								3
							</div>
							<div>
								<p className="font-medium">수련회 참가</p>
								<p className="text-muted-foreground">
									세부 일정은 추후 공지해드리겠습니다.
								</p>
							</div>
						</li>
					</ul>
				</motion.div>

				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className="mt-8"
					initial={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.6 }}
				>
					<Button className="gap-2" onClick={handleGoHome}>
						<Home className="h-4 w-4" />
						홈으로 돌아가기
					</Button>
				</motion.div>
			</motion.div>
		</>
	);
}
