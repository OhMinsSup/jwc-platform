"use client";

import { api } from "@jwc/backend/convex/_generated/api";
import {
	DEPARTMENT_LABELS,
	GENDER_LABELS,
	STAY_TYPE_LABELS,
	TF_TEAM_LABELS,
} from "@jwc/schema";
import { Button, cn } from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	Calendar,
	CheckCircle2,
	ClipboardCheck,
	Edit3,
	User,
	Users,
} from "lucide-react";
import { useState, useTransition } from "react";
import {
	type StepSlug,
	useOnboardingFormStore,
} from "@/store/onboarding-form-store";

const formVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.06, delayChildren: 0.1 },
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 16 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.4, ease: "easeOut" },
	},
};

interface InfoRowProps {
	label: string;
	value: string | undefined;
}

function InfoRow({ label, value }: InfoRowProps) {
	return (
		<div className="flex justify-between border-border/30 border-b py-2.5 last:border-0">
			<span className="text-muted-foreground text-sm">{label}</span>
			<span className="font-medium text-foreground text-sm">
				{value || "-"}
			</span>
		</div>
	);
}

interface InfoCardProps {
	icon: React.ReactNode;
	title: string;
	children: React.ReactNode;
	onEdit?: () => void;
}

function InfoCard({ icon, title, children, onEdit }: InfoCardProps) {
	return (
		<div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
			<div className="flex items-center justify-between border-border/30 border-b bg-muted/30 px-5 py-4">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
						{icon}
					</div>
					<span className="font-medium text-foreground">{title}</span>
				</div>
				{onEdit && (
					<button
						className="flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-primary"
						onClick={onEdit}
						type="button"
					>
						<Edit3 className="h-3.5 w-3.5" />
						수정
					</button>
				)}
			</div>
			<div className="px-5 py-2">{children}</div>
		</div>
	);
}

export function ConfirmStep() {
	const navigate = useNavigate();
	const {
		personalInfo,
		attendanceInfo,
		supportInfo,
		additionalInfo,
		setCurrentStep,
		clearForm,
	} = useOnboardingFormStore();
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const upsert = useAction(api.onboardingActions.upsert);

	const handleBack = () => {
		startTransition(async () => {
			setCurrentStep("support");
			await navigate({
				to: "/onboarding/$step",
				params: { step: "support" },
			});
		});
	};

	const goToStep = (step: StepSlug) => {
		startTransition(async () => {
			setCurrentStep(step);
			await navigate({ to: "/onboarding/$step", params: { step } });
		});
	};

	const handleSubmit = () => {
		if (!(personalInfo && attendanceInfo)) {
			setError(
				"필수 정보가 누락되었습니다. 이전 단계로 돌아가 정보를 입력해주세요."
			);
			return;
		}

		const { gender, department, name, phone, ageGroup } = personalInfo;
		const { stayType, attendanceDate, pickupTimeDescription } = attendanceInfo;

		// 필수 필드 검증
		if (!(gender && department && stayType)) {
			setError(
				"필수 정보가 누락되었습니다. 이전 단계로 돌아가 정보를 입력해주세요."
			);
			return;
		}

		startTransition(async () => {
			setError(null);

			try {
				// 평문 데이터를 직접 전달 (암호화는 Convex action 내부에서 처리)
				await upsert({
					name,
					phone,
					gender,
					department,
					ageGroup,
					stayType,
					attendanceDate,
					pickupTimeDescription,
					isPaid: false,
					tfTeam: supportInfo?.tfTeam,
					canProvideRide: supportInfo?.canProvideRide,
					rideDetails: supportInfo?.rideDetails,
					tshirtSize: additionalInfo?.tshirtSize ?? undefined,
				});

				clearForm();
				setCurrentStep("complete");
				await navigate({
					to: "/onboarding/$step",
					params: { step: "complete" },
				});
			} catch (err) {
				console.error("Failed to submit application:", err);
				setError("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
			}
		});
	};

	return (
		<div className="mx-auto w-full max-w-xl">
			{/* 헤더 */}
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="mb-10"
				initial={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.5 }}
			>
				<div className="mb-3 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
						<ClipboardCheck className="h-5 w-5 text-primary" />
					</div>
					<span className="font-medium text-primary text-sm">Step 5 of 5</span>
				</div>
				<h1 className="mb-2 font-bold text-2xl text-foreground md:text-3xl">
					신청 내용 확인
				</h1>
				<p className="text-muted-foreground">
					입력하신 정보를 확인해주세요. 수정이 필요하면 각 섹션의 수정 버튼을
					눌러주세요
				</p>
			</motion.div>

			<motion.div
				animate="visible"
				className="space-y-4"
				initial="hidden"
				variants={formVariants}
			>
				{/* 개인 정보 */}
				<motion.div variants={itemVariants}>
					<InfoCard
						icon={<User className="h-4 w-4 text-muted-foreground" />}
						onEdit={() => goToStep("personal")}
						title="개인 정보"
					>
						<InfoRow label="이름" value={personalInfo?.name} />
						<InfoRow label="연락처" value={personalInfo?.phone} />
						<InfoRow
							label="성별"
							value={
								personalInfo?.gender
									? GENDER_LABELS[personalInfo.gender]
									: undefined
							}
						/>
						<InfoRow
							label="소속"
							value={
								personalInfo?.department
									? DEPARTMENT_LABELS[personalInfo.department]
									: undefined
							}
						/>
						<InfoRow label="연령대" value={personalInfo?.ageGroup} />
					</InfoCard>
				</motion.div>

				{/* 참석 정보 */}
				<motion.div variants={itemVariants}>
					<InfoCard
						icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
						onEdit={() => goToStep("attendance")}
						title="참석 정보"
					>
						<InfoRow
							label="숙박 형태"
							value={
								attendanceInfo?.stayType
									? STAY_TYPE_LABELS[attendanceInfo.stayType]
									: undefined
							}
						/>
						{attendanceInfo?.stayType &&
							attendanceInfo.stayType !== "3nights4days" && (
								<>
									{attendanceInfo.attendanceDate && (
										<InfoRow
											label="참석 일시"
											value={format(
												parseISO(attendanceInfo.attendanceDate),
												"yyyy년 M월 d일 (EEE) HH:mm",
												{ locale: ko }
											)}
										/>
									)}
									{attendanceInfo.pickupTimeDescription && (
										<InfoRow
											label="추가 안내"
											value={attendanceInfo.pickupTimeDescription}
										/>
									)}
								</>
							)}
					</InfoCard>
				</motion.div>

				{/* 봉사 및 지원 */}
				<motion.div variants={itemVariants}>
					<InfoCard
						icon={<Users className="h-4 w-4 text-muted-foreground" />}
						onEdit={() => goToStep("support")}
						title="봉사 및 지원"
					>
						<InfoRow
							label="TF팀"
							value={
								supportInfo?.tfTeam && supportInfo.tfTeam !== "none"
									? TF_TEAM_LABELS[supportInfo.tfTeam]
									: "참여 안함"
							}
						/>
						<InfoRow
							label="차량 지원"
							value={supportInfo?.canProvideRide ? "가능" : "불가능"}
						/>
						{supportInfo?.canProvideRide && supportInfo.rideDetails && (
							<InfoRow label="차량 정보" value={supportInfo.rideDetails} />
						)}
					</InfoCard>
				</motion.div>

				{/* 추가 정보 */}
				{/* <motion.div variants={itemVariants}>
					<InfoCard
						icon={<Shirt className="h-4 w-4 text-muted-foreground" />}
						onEdit={() => goToStep("additional")}
						title="추가 정보"
					>
						<InfoRow
							label="티셔츠 사이즈"
							value={
								additionalInfo?.tshirtSize
									? TSHIRT_SIZE_LABELS[additionalInfo.tshirtSize]
									: undefined
							}
						/>
					</InfoCard>
				</motion.div> */}

				{/* 에러 메시지 */}
				{error && (
					<motion.div
						animate={{ opacity: 1, scale: 1 }}
						className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
						initial={{ opacity: 0, scale: 0.95 }}
					>
						{error}
					</motion.div>
				)}

				{/* 버튼 영역 */}
				<motion.div className="flex gap-3 pt-6" variants={itemVariants}>
					<Button
						className="h-12 rounded-xl border-border/50 px-6 hover:bg-muted/50"
						disabled={isPending}
						onClick={handleBack}
						type="button"
						variant="outline"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						이전
					</Button>
					<Button
						className={cn(
							"h-12 flex-1 rounded-xl font-medium shadow-lg transition-all duration-200",
							"bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
							"text-primary-foreground shadow-primary/20"
						)}
						disabled={isPending}
						onClick={handleSubmit}
						type="button"
					>
						{isPending ? (
							<motion.div
								animate={{ rotate: 360 }}
								className="h-5 w-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
								transition={{
									duration: 1,
									repeat: Number.POSITIVE_INFINITY,
									ease: "linear",
								}}
							/>
						) : (
							<>
								<CheckCircle2 className="mr-2 h-5 w-5" />
								신청 완료
							</>
						)}
					</Button>
				</motion.div>
			</motion.div>
		</div>
	);
}

export default ConfirmStep;
