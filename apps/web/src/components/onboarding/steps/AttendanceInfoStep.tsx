import { zodResolver } from "@hookform/resolvers/zod";
import { STAY_TYPE_LABELS, type StayType, StayTypeEnum } from "@jwc/schema";
import {
	Button,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	RadioGroup,
	RadioGroupItem,
	Textarea,
} from "@jwc/ui";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { useOnboardingFormStore } from "@/lib/onboarding-form-store";

interface AttendanceInfoStepProps {
	onNext: () => void;
}

const attendanceSchema = z.object({
	stayType: StayTypeEnum,
	pickupTimeDescription: z.string().max(500).optional(),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

const STAY_OPTIONS: { value: StayType; label: string; description: string }[] =
	[
		{
			value: "3nights4days",
			label: STAY_TYPE_LABELS["3nights4days"],
			description: "전체 일정 참석",
		},
		{
			value: "2nights3days",
			label: STAY_TYPE_LABELS["2nights3days"],
			description: "부분 참석",
		},
		{
			value: "1night2days",
			label: STAY_TYPE_LABELS["1night2days"],
			description: "부분 참석",
		},
		{
			value: "dayTrip",
			label: STAY_TYPE_LABELS.dayTrip,
			description: "숙박 없이 당일만 참석",
		},
	];

export function AttendanceInfoStep({ onNext }: AttendanceInfoStepProps) {
	const { formData, updateFormData } = useOnboardingFormStore();

	const form = useForm<AttendanceFormData>({
		resolver: zodResolver(attendanceSchema),
		defaultValues: {
			stayType: formData.stayType ?? undefined,
			pickupTimeDescription: formData.pickupTimeDescription ?? "",
		},
	});

	const stayType = form.watch("stayType");
	const isPartialAttendance = stayType && stayType !== "3nights4days";

	const onSubmit = (data: AttendanceFormData) => {
		updateFormData(data);
		onNext();
	};

	return (
		<motion.div
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			initial={{ opacity: 0, x: 20 }}
			transition={{ duration: 0.3 }}
		>
			<div className="mb-8">
				<h2 className="mb-2 font-bold text-2xl">참석 정보</h2>
				<p className="text-muted-foreground">참석 일정을 선택해주세요.</p>
			</div>

			<Form {...form}>
				<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
					{/* 숙박 형태 */}
					<FormField
						control={form.control}
						name="stayType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>숙박 형태 *</FormLabel>
								<FormControl>
									<RadioGroup
										className="grid gap-3"
										defaultValue={field.value}
										onValueChange={field.onChange}
									>
										{STAY_OPTIONS.map((option) => (
											<div
												className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
													field.value === option.value
														? "border-primary bg-primary/5"
														: "hover:bg-muted/50"
												}`}
												key={option.value}
											>
												<RadioGroupItem
													id={option.value}
													value={option.value}
												/>
												<label
													className="flex flex-1 cursor-pointer flex-col"
													htmlFor={option.value}
												>
													<span className="font-medium">{option.label}</span>
													<span className="text-muted-foreground text-sm">
														{option.description}
													</span>
												</label>
											</div>
										))}
									</RadioGroup>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 부분 참석시 추가 정보 */}
					{isPartialAttendance && (
						<motion.div
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							initial={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.2 }}
						>
							<FormField
								control={form.control}
								name="pickupTimeDescription"
								render={({ field }) => (
									<FormItem>
										<FormLabel>참석 가능 시간 / 픽업 희망 시간</FormLabel>
										<FormControl>
											<Textarea
												className="min-h-[100px]"
												placeholder="예: 금요일 저녁 7시 이후 도착 예정, 토요일 오후 3시 픽업 희망"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											부분 참석 시 참석 가능한 시간이나 픽업 희망 시간을
											알려주세요.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</motion.div>
					)}

					<div className="flex justify-end pt-4">
						<Button className="gap-2" type="submit">
							다음
							<ArrowRight className="h-4 w-4" />
						</Button>
					</div>
				</form>
			</Form>
		</motion.div>
	);
}

export default AttendanceInfoStep;
