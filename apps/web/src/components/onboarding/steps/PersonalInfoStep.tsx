import { zodResolver } from "@hookform/resolvers/zod";
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
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useOnboardingFormStore } from "@/lib/onboarding-form-store";

const personalInfoSchema = z.object({
	name: z.string().min(2, "이름은 2글자 이상이어야 합니다"),
	phone: z
		.string()
		.regex(/^01[016789]-?\d{3,4}-?\d{4}$/, "올바른 전화번호를 입력해주세요"),
	gender: z.enum(["male", "female"], {
		message: "성별을 선택해주세요",
	}),
	department: z.enum(["youth1", "youth2", "other"], {
		message: "소속 부서를 선택해주세요",
	}),
	ageGroup: z.string().min(1, "또래를 선택해주세요"),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

const AGE_GROUPS = [
	{ value: "1997-1999", label: "97-99년생" },
	{ value: "2000-2002", label: "00-02년생" },
	{ value: "2003-2005", label: "03-05년생" },
	{ value: "2006-2008", label: "06-08년생" },
];

export function PersonalInfoStep() {
	const navigate = useNavigate();
	const { formData, updateFormData, nextStep } = useOnboardingFormStore();

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
										<div className="flex items-center space-x-2">
											<RadioGroupItem id="male" value="male" />
											<label className="cursor-pointer" htmlFor="male">
												남성
											</label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem id="female" value="female" />
											<label className="cursor-pointer" htmlFor="female">
												여성
											</label>
										</div>
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
										<SelectItem value="youth1">청년1부</SelectItem>
										<SelectItem value="youth2">청년2부</SelectItem>
										<SelectItem value="other">기타</SelectItem>
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
								<Select
									defaultValue={field.value}
									onValueChange={field.onChange}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="또래를 선택해주세요" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{AGE_GROUPS.map((group) => (
											<SelectItem key={group.value} value={group.value}>
												{group.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
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
