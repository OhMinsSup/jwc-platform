import { zodResolver } from "@hookform/resolvers/zod";
import { TF_TEAM_LABELS, type TfTeam, TfTeamEnum } from "@jwc/schema";
import {
	Button,
	Checkbox,
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
import { ArrowRight, Car, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { useOnboardingFormStore } from "@/lib/onboarding-form-store";

const supportSchema = z.object({
	tfTeam: TfTeamEnum.optional(),
	canProvideRide: z.boolean().optional(),
	rideDetails: z.string().max(500).optional(),
});

type SupportFormData = z.infer<typeof supportSchema>;

const TF_TEAM_OPTIONS: { value: TfTeam; label: string; description: string }[] =
	[
		{
			value: "none",
			label: TF_TEAM_LABELS.none,
			description: "TF팀에 참여하지 않습니다",
		},
		{
			value: "praise",
			label: TF_TEAM_LABELS.praise,
			description: "예배 찬양 인도 및 반주",
		},
		{
			value: "program",
			label: TF_TEAM_LABELS.program,
			description: "레크레이션 및 친교 프로그램 진행",
		},
		{
			value: "media",
			label: TF_TEAM_LABELS.media,
			description: "사진/영상 촬영 및 편집",
		},
	];

interface SupportInfoStepProps {
	onNext: () => void;
}

export function SupportInfoStep({ onNext }: SupportInfoStepProps) {
	const { formData, updateFormData } = useOnboardingFormStore();

	const form = useForm<SupportFormData>({
		resolver: zodResolver(supportSchema),
		defaultValues: {
			tfTeam: formData.tfTeam ?? "none",
			canProvideRide: formData.canProvideRide ?? false,
			rideDetails: formData.rideDetails ?? "",
		},
	});

	const canProvideRide = form.watch("canProvideRide");

	const onSubmit = (data: SupportFormData) => {
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
				<h2 className="mb-2 font-bold text-2xl">봉사 및 지원</h2>
				<p className="text-muted-foreground">
					수련회 준비에 함께해 주실 부분이 있으시면 알려주세요.
				</p>
			</div>

			<Form {...form}>
				<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
					{/* TF 팀 선택 */}
					<FormField
						control={form.control}
						name="tfTeam"
						render={({ field }) => (
							<FormItem>
								<div className="mb-4 flex items-center gap-2">
									<Users className="h-5 w-5 text-primary" />
									<FormLabel className="text-base">TF팀 참여 (선택)</FormLabel>
								</div>
								<FormDescription className="mb-4">
									수련회 준비에 참여하고 싶은 팀을 선택해주세요.
								</FormDescription>
								<FormControl>
									<RadioGroup
										className="grid gap-3"
										defaultValue={field.value}
										onValueChange={field.onChange}
									>
										{TF_TEAM_OPTIONS.map((option) => (
											<div
												className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
													field.value === option.value
														? "border-primary bg-primary/5"
														: "hover:bg-muted/50"
												}`}
												key={option.value}
											>
												<RadioGroupItem
													id={`tf-${option.value}`}
													value={option.value}
												/>
												<label
													className="flex flex-1 cursor-pointer flex-col"
													htmlFor={`tf-${option.value}`}
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

					{/* 차량 지원 */}
					<div className="space-y-4 rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<Car className="h-5 w-5 text-primary" />
							<span className="font-medium">차량 지원</span>
						</div>

						<FormField
							control={form.control}
							name="canProvideRide"
							render={({ field }) => (
								<FormItem className="flex items-center space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormLabel className="cursor-pointer font-normal">
										차량 지원이 가능합니다
									</FormLabel>
								</FormItem>
							)}
						/>

						{canProvideRide && (
							<motion.div
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								initial={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.2 }}
							>
								<FormField
									control={form.control}
									name="rideDetails"
									render={({ field }) => (
										<FormItem>
											<FormLabel>차량 정보</FormLabel>
											<FormControl>
												<Textarea
													className="min-h-[80px]"
													placeholder="예: 7인승 차량, 4명 탑승 가능, 금요일 저녁 출발 가능"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												탑승 가능 인원, 출발 가능 시간 등을 알려주세요.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</motion.div>
						)}
					</div>

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

export default SupportInfoStep;
