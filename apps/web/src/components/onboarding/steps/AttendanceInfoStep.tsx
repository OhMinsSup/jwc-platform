"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { STAY_TYPE_LABELS, type StayType, StayTypeEnum } from "@jwc/schema";
import {
	Button,
	Calendar,
	cn,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	ArrowRight,
	Calendar as CalendarIcon,
	Check,
	Clock,
	type LucideIcon,
	MessageSquare,
	Moon,
	Sun,
	Tent,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
	attendanceDate: z.string().optional(),
	pickupTimeDescription: z.string().max(500).optional(),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

// 시간 선택 옵션 (30분 단위)
const TIME_OPTIONS = [
	{ value: "06:00", label: "오전 6:00" },
	{ value: "06:30", label: "오전 6:30" },
	{ value: "07:00", label: "오전 7:00" },
	{ value: "07:30", label: "오전 7:30" },
	{ value: "08:00", label: "오전 8:00" },
	{ value: "08:30", label: "오전 8:30" },
	{ value: "09:00", label: "오전 9:00" },
	{ value: "09:30", label: "오전 9:30" },
	{ value: "10:00", label: "오전 10:00" },
	{ value: "10:30", label: "오전 10:30" },
	{ value: "11:00", label: "오전 11:00" },
	{ value: "11:30", label: "오전 11:30" },
	{ value: "12:00", label: "오후 12:00" },
	{ value: "12:30", label: "오후 12:30" },
	{ value: "13:00", label: "오후 1:00" },
	{ value: "13:30", label: "오후 1:30" },
	{ value: "14:00", label: "오후 2:00" },
	{ value: "14:30", label: "오후 2:30" },
	{ value: "15:00", label: "오후 3:00" },
	{ value: "15:30", label: "오후 3:30" },
	{ value: "16:00", label: "오후 4:00" },
	{ value: "16:30", label: "오후 4:30" },
	{ value: "17:00", label: "오후 5:00" },
	{ value: "17:30", label: "오후 5:30" },
	{ value: "18:00", label: "오후 6:00" },
	{ value: "18:30", label: "오후 6:30" },
	{ value: "19:00", label: "오후 7:00" },
	{ value: "19:30", label: "오후 7:30" },
	{ value: "20:00", label: "오후 8:00" },
	{ value: "20:30", label: "오후 8:30" },
	{ value: "21:00", label: "오후 9:00" },
	{ value: "21:30", label: "오후 9:30" },
	{ value: "22:00", label: "오후 10:00" },
];

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
		Icon: CalendarIcon,
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
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);

	const form = useForm<AttendanceFormData>({
		resolver: standardSchemaResolver(attendanceSchema),
		defaultValues: {
			stayType: attendanceInfo?.stayType ?? undefined,
			attendanceDate: attendanceInfo?.attendanceDate ?? "",
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
				attendanceDate: attendanceInfo.attendanceDate ?? "",
				pickupTimeDescription: attendanceInfo.pickupTimeDescription ?? "",
			});
		}
	}, [attendanceInfo, form]);

	// ISO 8601 문자열을 Date 객체로 변환
	const parseDateTime = (dateString: string | undefined): Date | undefined => {
		if (!dateString) {
			return;
		}
		try {
			return parseISO(dateString);
		} catch {
			return;
		}
	};

	// Date 객체와 시간을 ISO 8601 형식 문자열로 변환
	const formatDateTime = (date: Date, time: string): string => {
		const dateStr = format(date, "yyyy-MM-dd");
		return `${dateStr}T${time}:00`;
	};

	// ISO 8601 문자열에서 시간(HH:mm) 추출
	const getTimeFromDate = (dateString: string | undefined): string => {
		if (!dateString) {
			return "09:00";
		}
		try {
			const date = parseISO(dateString);
			return format(date, "HH:mm");
		} catch {
			return "09:00";
		}
	};

	const onSubmit = async (data: AttendanceFormData) => {
		setIsLoading(true);
		try {
			setAttendanceInfo({
				stayType: data.stayType,
				attendanceDate: data.attendanceDate,
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
							<div className="space-y-5 rounded-xl border border-border/50 bg-muted/20 p-5">
								{/* 날짜/시간 선택 */}
								<div>
									<div className="mb-4 flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
											<CalendarIcon className="h-5 w-5 text-primary" />
										</div>
										<div>
											<div className="font-medium text-foreground">
												참석 일시 선택
											</div>
											<div className="text-muted-foreground text-sm">
												참석 또는 픽업 희망 날짜와 시간을 선택해주세요
											</div>
										</div>
									</div>
									<FormField
										control={form.control}
										name="attendanceDate"
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<Popover
														onOpenChange={setIsCalendarOpen}
														open={isCalendarOpen}
													>
														<PopoverTrigger asChild>
															<Button
																className={cn(
																	"w-full justify-start text-left font-normal",
																	!field.value && "text-muted-foreground"
																)}
																variant="outline"
															>
																<CalendarIcon className="mr-2 h-4 w-4" />
																{field.value
																	? format(
																			parseDateTime(field.value) ?? new Date(),
																			"yyyy년 M월 d일 (EEE) HH:mm",
																			{ locale: ko }
																		)
																	: "날짜와 시간을 선택하세요"}
															</Button>
														</PopoverTrigger>
														<PopoverContent
															align="start"
															className="w-auto p-0"
														>
															<div className="space-y-4 p-4">
																<Calendar
																	autoFocus
																	disabled={(date) => {
																		// 수련회 기간 내 날짜만 선택 가능 (2026년 1월 8-11일)
																		const minDate = new Date(2026, 0, 8);
																		const maxDate = new Date(2026, 0, 11);
																		return date < minDate || date > maxDate;
																	}}
																	locale={ko}
																	mode="single"
																	month={new Date(2026, 0)}
																	onSelect={(date) => {
																		if (date) {
																			const time = getTimeFromDate(field.value);
																			field.onChange(
																				formatDateTime(date, time)
																			);
																		}
																	}}
																	selected={parseDateTime(field.value)}
																/>
																<div className="border-t pt-4">
																	<span className="mb-2 block font-medium text-sm">
																		시간 선택
																	</span>
																	<Select
																		onValueChange={(time) => {
																			const currentDate = parseDateTime(
																				field.value
																			);
																			if (currentDate) {
																				field.onChange(
																					formatDateTime(currentDate, time)
																				);
																			} else {
																				// 날짜가 없으면 수련회 첫날로 기본 설정
																				const defaultDate = new Date(
																					2026,
																					0,
																					8
																				);
																				field.onChange(
																					formatDateTime(defaultDate, time)
																				);
																			}
																		}}
																		value={getTimeFromDate(field.value)}
																	>
																		<SelectTrigger className="w-full">
																			<Clock className="mr-2 h-4 w-4 text-muted-foreground" />
																			<SelectValue placeholder="시간을 선택하세요" />
																		</SelectTrigger>
																		<SelectContent>
																			{TIME_OPTIONS.map((option) => (
																				<SelectItem
																					key={option.value}
																					value={option.value}
																				>
																					{option.label}
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</div>
																<Button
																	className="w-full"
																	onClick={() => setIsCalendarOpen(false)}
																	type="button"
																>
																	확인
																</Button>
															</div>
														</PopoverContent>
													</Popover>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* 추가 안내사항 */}
								<div>
									<div className="mb-4 flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
											<MessageSquare className="h-5 w-5 text-primary" />
										</div>
										<div>
											<div className="font-medium text-foreground">
												추가 안내 사항
											</div>
											<div className="text-muted-foreground text-sm">
												추가로 전달할 내용이 있으면 작성해주세요
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
