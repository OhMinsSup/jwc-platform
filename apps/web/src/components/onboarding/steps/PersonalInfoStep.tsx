"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { AGE_GROUP_REGEX, DepartmentEnum, GenderEnum } from "@jwc/schema";
import {
	Button,
	cn,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { AsYouType } from "libphonenumber-js/min";
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	Calendar,
	Phone,
	User,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { AGE_GROUPS, DEPARTMENTS } from "@/lib/constants";
import { useOnboardingFormStore } from "@/store/onboarding-form-store";

// 개인정보 스키마
const personalInfoSchema = z.object({
	name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
	phone: z
		.string()
		.min(1, "전화번호를 입력해주세요.")
		.refine((value) => {
			const asYouType = new AsYouType("KR");
			asYouType.input(value);
			const number = asYouType.getNumber();
			return number?.isValid() ?? false;
		}, "유효한 전화번호를 입력해주세요."),
	gender: GenderEnum,
	department: DepartmentEnum,
	ageGroup: z.string().regex(AGE_GROUP_REGEX, "올바른 연령대 형식이 아닙니다"),
});

type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

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

// 선택 버튼 컴포넌트
function SelectionButton({
	selected,
	onClick,
	children,
	className,
}: {
	selected: boolean;
	onClick: () => void;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<button
			className={cn(
				"rounded-full px-5 py-2.5 font-medium text-sm transition-all duration-200",
				"border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
				selected
					? "border-primary bg-primary text-primary-foreground shadow-md"
					: "border-border bg-muted/50 text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted",
				className
			)}
			onClick={onClick}
			type="button"
		>
			{children}
		</button>
	);
}

export function PersonalInfoStep() {
	const navigate = useNavigate();
	const {
		personalInfo,
		setPersonalInfo,
		setCurrentStep,
		isLoading,
		setIsLoading,
	} = useOnboardingFormStore();
	const formRef = useRef<HTMLFormElement>(null);

	const form = useForm<PersonalInfoInput>({
		resolver: standardSchemaResolver(personalInfoSchema),
		defaultValues: {
			name: personalInfo.name,
			phone: personalInfo.phone,
			gender: personalInfo.gender ?? undefined,
			department: personalInfo.department ?? undefined,
			ageGroup: personalInfo.ageGroup,
		},
		mode: "onChange",
	});

	// Store 값이 변경되면 폼 값도 업데이트
	useEffect(() => {
		if (personalInfo) {
			form.reset({
				name: personalInfo.name,
				phone: personalInfo.phone,
				gender: personalInfo.gender ?? undefined,
				department: personalInfo.department ?? undefined,
				ageGroup: personalInfo.ageGroup,
			});
		}
	}, [personalInfo, form]);

	const onSubmit = async (data: PersonalInfoInput) => {
		setIsLoading(true);
		try {
			setPersonalInfo(data);
			setCurrentStep("attendance");
			await navigate({
				to: "/onboarding/$step",
				params: { step: "attendance" },
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = async () => {
		setCurrentStep("welcome");
		await navigate({ to: "/onboarding/$step", params: { step: "welcome" } });
	};

	// 전화번호 포맷팅 함수
	const formatPhoneNumber = useCallback((value: string) => {
		const asYouType = new AsYouType("KR");
		return asYouType.input(value);
	}, []);

	const handlePhoneChange = useCallback(
		(
			e: React.ChangeEvent<HTMLInputElement>,
			onChange: (value: string) => void
		) => {
			const rawValue = e.target.value.replace(/[^\d]/g, "");
			const formattedValue = formatPhoneNumber(rawValue);
			onChange(formattedValue);
		},
		[formatPhoneNumber]
	);

	const genderOptions = [
		{ value: "male" as const, label: "남성" },
		{ value: "female" as const, label: "여성" },
	];

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
						<User className="h-5 w-5 text-primary" />
					</div>
					<span className="font-medium text-primary text-sm">Step 1 of 5</span>
				</div>
				<h1 className="mb-2 font-bold text-2xl text-foreground md:text-3xl">
					기본 정보를 입력해주세요
				</h1>
				<p className="text-muted-foreground">
					정확한 정보 입력은 더 나은 서비스 제공에 도움이 됩니다
				</p>
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
					{/* 이름 입력 */}
					<motion.div variants={itemVariants}>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex items-center gap-2 font-medium text-foreground text-sm">
										<User className="h-4 w-4 text-muted-foreground" />
										이름
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											className="h-12 border-border/50 bg-muted/30 transition-all duration-200 focus:border-primary focus:bg-background"
											placeholder="이름을 입력하세요"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>

					{/* 전화번호 입력 */}
					<motion.div variants={itemVariants}>
						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex items-center gap-2 font-medium text-foreground text-sm">
										<Phone className="h-4 w-4 text-muted-foreground" />
										전화번호
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											className="h-12 border-border/50 bg-muted/30 transition-all duration-200 focus:border-primary focus:bg-background"
											onChange={(e) => handlePhoneChange(e, field.onChange)}
											placeholder="010-0000-0000"
											type="tel"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>

					{/* 성별 선택 */}
					<motion.div variants={itemVariants}>
						<FormField
							control={form.control}
							name="gender"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="mb-3 flex items-center gap-2 font-medium text-foreground text-sm">
										<Users className="h-4 w-4 text-muted-foreground" />
										성별
									</FormLabel>
									<FormControl>
										<div className="flex flex-wrap gap-2">
											{genderOptions.map((option) => (
												<SelectionButton
													key={option.value}
													onClick={() => field.onChange(option.value)}
													selected={field.value === option.value}
												>
													{option.label}
												</SelectionButton>
											))}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>

					{/* 소속 선택 */}
					<motion.div variants={itemVariants}>
						<FormField
							control={form.control}
							name="department"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="mb-3 flex items-center gap-2 font-medium text-foreground text-sm">
										<Building2 className="h-4 w-4 text-muted-foreground" />
										소속
									</FormLabel>
									<FormControl>
										<div className="flex flex-wrap gap-2">
											{DEPARTMENTS.map((dept) => (
												<SelectionButton
													key={dept.value}
													onClick={() => field.onChange(dept.value)}
													selected={field.value === dept.value}
												>
													{dept.label}
												</SelectionButton>
											))}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>

					{/* 연령대 선택 */}
					<motion.div variants={itemVariants}>
						<FormField
							control={form.control}
							name="ageGroup"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="mb-3 flex items-center gap-2 font-medium text-foreground text-sm">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										연령대
									</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="h-12 border-border/50 bg-muted/30 transition-all duration-200 focus:border-primary focus:bg-background">
												<SelectValue placeholder="연령대를 선택하세요" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{AGE_GROUPS.map((age) => (
												<SelectItem key={age.value} value={age.value}>
													{age.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>

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

export default PersonalInfoStep;
