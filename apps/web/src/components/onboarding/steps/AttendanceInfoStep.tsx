"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { STAY_TYPE_LABELS, type StayType, StayTypeEnum } from "@jwc/schema";
import {
	Button,
	cn,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Textarea,
} from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	ArrowRight,
	Calendar,
	Check,
	Clock,
	type LucideIcon,
	MessageSquare,
	Moon,
	Sun,
	Tent,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { useOnboardingFormStore } from "@/store/onboarding-form-store";

const formVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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

const attendanceSchema = z.object({
	stayType: StayTypeEnum,
	pickupTimeDescription: z.string().max(500).optional(),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

const STAY_OPTIONS: {
	value: StayType;
	label: string;
	description: string;
	Icon: LucideIcon;
}[] = [
	{
		value: "3nights4days",
		label: STAY_TYPE_LABELS["3nights4days"],
		description: "전체 일정 참석",
		Icon: Calendar,
	},
	{
		value: "2nights3days",
		label: STAY_TYPE_LABELS["2nights3days"],
		description: "부분 참석",
		Icon: Tent,
	},
	{
		value: "1night2days",
		label: STAY_TYPE_LABELS["1night2days"],
		description: "부분 참석",
		Icon: Moon,
	},
	{
		value: "dayTrip",
		label: STAY_TYPE_LABELS.dayTrip,
		description: "숙박 없이 당일만 참석",
		Icon: Sun,
	},
];

export function AttendanceInfoStep() {
	const navigate = useNavigate();
	const {
		attendanceInfo,
		setAttendanceInfo,
		setCurrentStep,
		isLoading,
		setIsLoading,
	} = useOnboardingFormStore();
	const formRef = useRef<HTMLFormElement>(null);

	const form = useForm<AttendanceFormData>({
		resolver: standardSchemaResolver(attendanceSchema),
		defaultValues: {
			stayType: attendanceInfo?.stayType ?? undefined,
			pickupTimeDescription: attendanceInfo?.pickupTimeDescription ?? "",
		},
		mode: "onChange",
	});

	const stayType = form.watch("stayType");
	const isPartialAttendance = stayType && stayType !== "3nights4days";

	// Store 값이 변경되면 폼 값도 업데이트
	useEffect(() => {
		if (attendanceInfo) {
			form.reset({
				stayType: attendanceInfo.stayType ?? undefined,
				pickupTimeDescription: attendanceInfo.pickupTimeDescription ?? "",
			});
		}
	}, [attendanceInfo, form]);

	const onSubmit = async (data: AttendanceFormData) => {
		setIsLoading(true);
		try {
			setAttendanceInfo({
				stayType: data.stayType,
				pickupTimeDescription: data.pickupTimeDescription,
			});
			setCurrentStep("support");
			await navigate({ to: "/onboarding/$step", params: { step: "support" } });
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = async () => {
		setCurrentStep("personal");
		await navigate({ to: "/onboarding/$step", params: { step: "personal" } });
	};

	return (
		<div className="mx-auto w-full max-w-xl px-4 py-8">
			{/* 헤더 */}
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="mb-10"
				initial={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.5 }}
			>
				<div className="mb-3 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
						<Calendar className="h-5 w-5 text-primary" />
					</div>
					<span className="font-medium text-primary text-sm">Step 2 of 5</span>
				</div>
				<h1 className="mb-2 font-bold text-2xl text-foreground md:text-3xl">
					참석 일정을 선택해주세요
				</h1>
				<p className="text-muted-foreground">수련회 참석 기간을 선택해주세요</p>
			</motion.div>

			<Form {...form}>
				<motion.form
					animate="visible"
					className="space-y-8"
					initial="hidden"
					onSubmit={form.handleSubmit(onSubmit)}
					ref={formRef}
					variants={formVariants}
				>
					{/* 숙박 형태 선택 */}
					<motion.div variants={itemVariants}>
						<FormField
							control={form.control}
							name="stayType"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="mb-4 flex items-center gap-2 font-medium text-foreground text-sm">
										<Clock className="h-4 w-4 text-muted-foreground" />
										숙박 형태
									</FormLabel>
									<FormControl>
										<div className="grid gap-3">
											{STAY_OPTIONS.map((option) => (
												<motion.button
													className={cn(
														"relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200",
														"focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
														field.value === option.value
															? "border-primary bg-primary/5 shadow-md"
															: "border-border/50 bg-muted/30 hover:border-border hover:bg-muted/50"
													)}
													key={option.value}
													onClick={() => field.onChange(option.value)}
													type="button"
													whileHover={{ scale: 1.01 }}
													whileTap={{ scale: 0.99 }}
												>
													<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background shadow-sm">
														<option.Icon className="h-6 w-6 text-muted-foreground" />
													</div>
													<div className="flex-1">
														<div className="font-medium text-foreground">
															{option.label}
														</div>
														<div className="text-muted-foreground text-sm">
															{option.description}
														</div>
													</div>
													{field.value === option.value && (
														<motion.div
															animate={{ scale: 1 }}
															className="absolute right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
															initial={{ scale: 0 }}
														>
															<Check className="h-4 w-4 text-primary-foreground" />
														</motion.div>
													)}
												</motion.button>
											))}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>

					{/* 부분 참석 시 추가 정보 */}
					{isPartialAttendance && (
						<motion.div
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							initial={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.3 }}
						>
							<div className="rounded-xl border border-border/50 bg-muted/20 p-5">
								<div className="mb-4 flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
										<MessageSquare className="h-5 w-5 text-primary" />
									</div>
									<div>
										<div className="font-medium text-foreground">
											참석 가능 시간 안내
										</div>
										<div className="text-muted-foreground text-sm">
											참석 또는 픽업 희망 시간을 알려주세요
										</div>
									</div>
								</div>
								<FormField
									control={form.control}
									name="pickupTimeDescription"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Textarea
													{...field}
													className="min-h-[100px] resize-none border-border/50 bg-background transition-all duration-200 focus:border-primary"
													placeholder="예: 금요일 저녁 7시 이후 도착 예정, 토요일 오후 3시 픽업 희망"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</motion.div>
					)}

					{/* 버튼 영역 */}
					<motion.div className="flex gap-3 pt-4" variants={itemVariants}>
						<Button
							className="h-12 rounded-xl border-border/50 px-6 hover:bg-muted/50"
							onClick={handleBack}
							type="button"
							variant="outline"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							이전
						</Button>
						<Button
							className="h-12 flex-1 rounded-xl bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90"
							disabled={isLoading || !form.formState.isValid}
							type="submit"
						>
							{isLoading ? (
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
									다음 단계
									<ArrowRight className="ml-2 h-4 w-4" />
								</>
							)}
						</Button>
					</motion.div>
				</motion.form>
			</Form>
		</div>
	);
}

export default AttendanceInfoStep;
