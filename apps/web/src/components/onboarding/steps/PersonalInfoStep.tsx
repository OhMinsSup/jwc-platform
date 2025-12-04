import { zodResolver } from "@hookform/resolvers/zod";
import {
	AGE_GROUP_REGEX,
	DEPARTMENT_LABELS,
	DepartmentEnum,
	GENDER_LABELS,
	GenderEnum,
} from "@jwc/schema";
import {
	Button,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@jwc/ui";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useOnboardingFormStore } from "@/lib/onboarding-form-store";

interface PersonalInfoStepProps {
	onNext: () => void;
}

const personalInfoSchema = z.object({
	name: z.string().min(2, "이름은 2글자 이상이어야 합니다"),
	phone: z
		.string()
		.regex(/^01[016789]-?\d{3,4}-?\d{4}$/, "올바른 전화번호를 입력해주세요"),
	gender: GenderEnum,
	department: DepartmentEnum,
	ageGroup: z
		.string()
		.min(1, "또래를 입력해주세요")
		.refine((value) => AGE_GROUP_REGEX.test(value), {
			message: "또래를 숫자 2자리로 입력해주세요. (예시: 00또래)",
		}),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

export function PersonalInfoStep({ onNext }: PersonalInfoStepProps) {
	const { formData, updateFormData } = useOnboardingFormStore();

	const form = useForm<PersonalInfoFormData>({
		resolver: zodResolver(personalInfoSchema),
		defaultValues: {
			name: formData.name,
			phone: formData.phone,
			gender: formData.gender || undefined,
			department: formData.department || undefined,
			ageGroup: formData.ageGroup,
		},
	});

	const onSubmit = (data: PersonalInfoFormData) => {
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
				<h2 className="mb-2 font-bold text-2xl">기본 정보</h2>
				<p className="text-muted-foreground">
					참가자의 기본 정보를 입력해주세요.
				</p>
			</div>

			<Form {...form}>
				<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
					{/* 이름 */}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>이름 *</FormLabel>
								<FormControl>
									<Input placeholder="홍길동" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 전화번호 */}
					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>전화번호 *</FormLabel>
								<FormControl>
									<Input placeholder="010-1234-5678" type="tel" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 성별 */}
					<FormField
						control={form.control}
						name="gender"
						render={({ field }) => (
							<FormItem>
								<FormLabel>성별 *</FormLabel>
								<FormControl>
									<RadioGroup
										className="flex gap-4"
										defaultValue={field.value}
										onValueChange={field.onChange}
									>
										{(Object.entries(GENDER_LABELS) as [string, string][]).map(
											([value, label]) => (
												<div
													className="flex items-center space-x-2"
													key={value}
												>
													<RadioGroupItem id={value} value={value} />
													<label className="cursor-pointer" htmlFor={value}>
														{label}
													</label>
												</div>
											)
										)}
									</RadioGroup>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 소속 부서 */}
					<FormField
						control={form.control}
						name="department"
						render={({ field }) => (
							<FormItem>
								<FormLabel>소속 부서 *</FormLabel>
								<Select
									defaultValue={field.value}
									onValueChange={field.onChange}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="부서를 선택해주세요" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{(
											Object.entries(DEPARTMENT_LABELS) as [string, string][]
										).map(([value, label]) => (
											<SelectItem key={value} value={value}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 또래 */}
					<FormField
						control={form.control}
						name="ageGroup"
						render={({ field }) => (
							<FormItem>
								<FormLabel>또래 *</FormLabel>
								<FormControl>
									<Input placeholder="00또래" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

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

export default PersonalInfoStep;
