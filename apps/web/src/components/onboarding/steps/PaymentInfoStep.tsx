import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
	ArrowRight,
	Banknote,
	CheckCircle2,
	ClipboardCopy,
	Info,
} from "lucide-react";
import { useState } from "react";
import { useOnboardingFormStore } from "@/lib/onboarding-form-store";

const PAYMENT_INFO = {
	bank: "카카오뱅크",
	accountNumber: "3333-12-3456789",
	accountHolder: "청년부 회계",
	amount: {
		"3nights4days": 50_000,
		"2nights3days": 40_000,
		"1night2days": 30_000,
		dayTrip: 20_000,
	} as const,
};

export function PaymentInfoStep() {
	const navigate = useNavigate();
	const { formData, nextStep } = useOnboardingFormStore();
	const [copied, setCopied] = useState(false);

	const stayType = formData.stayType || "3nights4days";
	const amount = PAYMENT_INFO.amount[stayType];

	const handleCopyAccount = async () => {
		await navigator.clipboard.writeText(PAYMENT_INFO.accountNumber);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleContinue = () => {
		nextStep();
		navigate({ to: "/onboarding" });
	};

	return (
		<motion.div
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			initial={{ opacity: 0, x: 20 }}
			transition={{ duration: 0.3 }}
		>
			<div className="mb-8">
				<h2 className="mb-2 font-bold text-2xl">참가비 안내</h2>
				<p className="text-muted-foreground">
					참가비 입금 안내입니다. 신청 후 입금해주세요.
				</p>
			</div>

			<div className="space-y-6">
				{/* 참가비 금액 */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Banknote className="h-5 w-5 text-primary" />
							참가비
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-baseline gap-2">
							<span className="font-bold text-4xl text-primary">
								{amount.toLocaleString()}
							</span>
							<span className="text-lg text-muted-foreground">원</span>
						</div>
						<p className="mt-2 text-muted-foreground text-sm">
							{stayType === "3nights4days" && "3박 4일 전체 참석 기준"}
							{stayType === "2nights3days" && "2박 3일 참석 기준"}
							{stayType === "1night2days" && "1박 2일 참석 기준"}
							{stayType === "dayTrip" && "당일 참석 기준"}
						</p>
					</CardContent>
				</Card>

				{/* 입금 계좌 정보 */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-lg">입금 계좌</CardTitle>
						<CardDescription>아래 계좌로 입금해주세요</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-lg bg-muted/50 p-4">
							<div className="mb-3 grid grid-cols-2 gap-2 text-sm">
								<span className="text-muted-foreground">은행</span>
								<span className="font-medium">{PAYMENT_INFO.bank}</span>
								<span className="text-muted-foreground">예금주</span>
								<span className="font-medium">
									{PAYMENT_INFO.accountHolder}
								</span>
							</div>
							<div className="flex items-center justify-between rounded-md bg-background p-3">
								<span className="font-medium font-mono text-lg">
									{PAYMENT_INFO.accountNumber}
								</span>
								<Button
									className="gap-2"
									onClick={handleCopyAccount}
									size="sm"
									variant="outline"
								>
									{copied ? (
										<>
											<CheckCircle2 className="h-4 w-4 text-green-500" />
											복사됨
										</>
									) : (
										<>
											<ClipboardCopy className="h-4 w-4" />
											복사
										</>
									)}
								</Button>
							</div>
						</div>

						<div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
							<Info className="mt-0.5 h-4 w-4 shrink-0" />
							<p className="text-sm">
								입금자명은 반드시 <strong>신청자 본인 이름</strong>으로
								해주세요.
							</p>
						</div>
					</CardContent>
				</Card>

				{/* 안내사항 */}
				<div className="rounded-lg border p-4">
					<h4 className="mb-3 font-medium">안내사항</h4>
					<ul className="space-y-2 text-muted-foreground text-sm">
						<li className="flex items-start gap-2">
							<span className="text-primary">•</span>
							입금 확인 후 참가 신청이 완료됩니다.
						</li>
						<li className="flex items-start gap-2">
							<span className="text-primary">•</span>
							입금 확인까지 1-2일 정도 소요될 수 있습니다.
						</li>
						<li className="flex items-start gap-2">
							<span className="text-primary">•</span>
							취소 시 환불 규정에 따라 환불됩니다.
						</li>
					</ul>
				</div>

				<div className="flex justify-end pt-4">
					<Button className="gap-2" onClick={handleContinue}>
						다음
						<ArrowRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</motion.div>
	);
}
