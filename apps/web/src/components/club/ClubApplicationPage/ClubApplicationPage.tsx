"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icons } from "@jwc/ui";
import { Badge } from "@jwc/ui/components/shadcn/badge";
import { Button } from "@jwc/ui/components/shadcn/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@jwc/ui/components/shadcn/card";
import { Progress } from "@jwc/ui/components/shadcn/progress";
import { Separator } from "@jwc/ui/components/shadcn/separator";
// import {
// 	ArrowLeft,
// 	ArrowRight,
// 	CheckCircle,
// 	Circle,
// 	Clock,
// 	FileText,
// 	Heart,
// 	Mail,
// 	Phone,
// 	Send,
// 	Star,
// 	User,
// 	Users,
// } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { ClubSelection } from "../ClubSelection/ClubSelection";
import { FormClubAvailableTime } from "../FormClubAvailableTime/FormClubAvailableTime";
import { FormClubEmail } from "../FormClubEmail/FormClubEmail";
import { FormClubExperience } from "../FormClubExperience/FormClubExperience";
import { FormClubMotivation } from "../FormClubMotivation/FormClubMotivation";
import { FormClubName } from "../FormClubName/FormClubName";
import { FormClubPhone } from "../FormClubPhone/FormClubPhone";

const clubFormSchema = z.object({
	clubId: z.string().min(1, "동아리를 선택해주세요"),
	name: z.string().min(1, "이름을 입력해주세요"),
	email: z.string().email("올바른 이메일 주소를 입력해주세요"),
	phone: z.string().min(1, "연락처를 입력해주세요"),
	motivation: z.string().min(10, "지원 동기를 10자 이상 입력해주세요"),
	experience: z.string().optional(),
	availableTime: z.string().min(1, "참여 가능 시간을 입력해주세요"),
});

type ClubFormData = z.infer<typeof clubFormSchema>;

const steps = [
	{
		id: "club",
		title: "동아리 선택",
		component: "ClubSelection",
		icon: Icons.Users,
		description: "참여하고 싶은 동아리를 선택해주세요",
	},
	{
		id: "name",
		title: "이름",
		component: "FormClubName",
		icon: Icons.User,
		description: "본명을 정확히 입력해주세요",
	},
	{
		id: "email",
		title: "이메일",
		component: "FormClubEmail",
		icon: Icons.Mail,
		description: "연락 가능한 이메일 주소를 입력해주세요",
	},
	{
		id: "phone",
		title: "연락처",
		component: "FormClubPhone",
		icon: Icons.Phone,
		description: "연락 가능한 전화번호를 입력해주세요",
	},
	{
		id: "motivation",
		title: "지원 동기",
		component: "FormClubMotivation",
		icon: Icons.Heart,
		description: "동아리에 지원하는 이유를 작성해주세요",
	},
	{
		id: "experience",
		title: "관련 경험",
		component: "FormClubExperience",
		icon: Icons.Star,
		description: "관련된 경험이나 특기사항을 작성해주세요",
	},
	{
		id: "availableTime",
		title: "참여 가능 시간",
		component: "FormClubAvailableTime",
		icon: Icons.Clock,
		description: "동아리 활동 참여 가능한 시간을 알려주세요",
	},
	{
		id: "confirm",
		title: "확인",
		component: "FormConfirm",
		icon: Icons.Send,
		description: "입력하신 내용을 확인하고 신청을 완료해주세요",
	},
];

export function ClubApplicationPage() {
	const [currentStep, setCurrentStep] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const methods = useForm<ClubFormData>({
		resolver: zodResolver(clubFormSchema),
		mode: "onChange",
	});

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isValid },
	} = methods;

	const watchedValues = watch();
	const progress = ((currentStep + 1) / steps.length) * 100;

	const nextStep = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const onSubmit = async (data: ClubFormData) => {
		setIsSubmitting(true);
		try {
			// TODO: API 호출로 동아리 신청 제출
			console.log("동아리 신청 데이터:", data);

			// 임시: 3초 후 완료
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// 완료 페이지로 이동
			setCurrentStep(steps.length);
		} catch (error) {
			console.error("동아리 신청 제출 실패:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderCurrentStep = () => {
		const step = steps[currentStep];

		switch (step?.component) {
			case "ClubSelection":
				return (
					<ClubSelection
						onClubSelectAction={(clubId) => setValue("clubId", clubId)}
						selectedClubId={watchedValues.clubId}
					/>
				);
			case "FormClubName":
				return <FormClubName />;
			case "FormClubEmail":
				return <FormClubEmail />;
			case "FormClubPhone":
				return <FormClubPhone />;
			case "FormClubMotivation":
				return <FormClubMotivation />;
			case "FormClubExperience":
				return <FormClubExperience />;
			case "FormClubAvailableTime":
				return <FormClubAvailableTime />;
			case "FormConfirm":
				return (
					<div className="space-y-6">
						<div className="space-y-2 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
								<Icons.FileText className="h-8 w-8 text-blue-600" />
							</div>
							<h2 className="font-bold text-2xl">신청 내용 확인</h2>
							<p className="text-muted-foreground">
								입력하신 내용을 확인하고 신청을 완료해주세요
							</p>
						</div>
						<div className="space-y-4">
							<Card className="border-l-4 border-l-blue-500">
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<Icons.User className="h-5 w-5" />
										신청자 정보
									</CardTitle>
								</CardHeader>
								<CardContent>
									<dl className="space-y-3">
										<div className="flex justify-between">
											<dt className="font-medium text-muted-foreground">
												이름:
											</dt>
											<dd className="font-semibold">{watchedValues.name}</dd>
										</div>
										<Separator />
										<div className="flex justify-between">
											<dt className="font-medium text-muted-foreground">
												이메일:
											</dt>
											<dd className="font-semibold">{watchedValues.email}</dd>
										</div>
										<Separator />
										<div className="flex justify-between">
											<dt className="font-medium text-muted-foreground">
												연락처:
											</dt>
											<dd className="font-semibold">{watchedValues.phone}</dd>
										</div>
										<Separator />
										<div className="flex justify-between">
											<dt className="font-medium text-muted-foreground">
												참여 가능 시간:
											</dt>
											<dd className="font-semibold">
												{watchedValues.availableTime}
											</dd>
										</div>
									</dl>
								</CardContent>
							</Card>

							<Card className="border-l-4 border-l-green-500">
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<Icons.Heart className="h-5 w-5" />
										지원 동기
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="whitespace-pre-wrap text-sm leading-relaxed">
										{watchedValues.motivation}
									</p>
								</CardContent>
							</Card>

							{watchedValues.experience && (
								<Card className="border-l-4 border-l-purple-500">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-lg">
											<Icons.Star className="h-5 w-5" />
											관련 경험
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="whitespace-pre-wrap text-sm leading-relaxed">
											{watchedValues.experience}
										</p>
									</CardContent>
								</Card>
							)}
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	// 완료 페이지
	if (currentStep >= steps.length) {
		return (
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<Card className="shadow-lg">
					<CardContent className="p-12 text-center">
						<div className="space-y-6">
							<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
								<svg
									className="h-10 w-10 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>완료</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<div className="space-y-2">
								<h2 className="font-bold text-3xl text-green-700">
									신청이 완료되었습니다!
								</h2>
								<p className="text-lg text-muted-foreground">
									동아리 신청이 성공적으로 제출되었습니다.
								</p>
							</div>
							<div className="rounded-lg bg-blue-50 p-4">
								<p className="text-blue-800 text-sm">
									<strong>다음 단계:</strong> 담당자가 검토 후 3-5일 내에
									연락드리겠습니다.
									<br />
									궁금한 점이 있으시면 언제든 문의해주세요.
								</p>
							</div>
							<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
								<Button
									variant="default"
									onClick={() => {
										window.location.href = "/church";
									}}
									className="flex items-center gap-2"
								>
									<svg
										className="h-4 w-4"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<title>홈 아이콘</title>
										<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
									</svg>
									메인으로 돌아가기
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										window.location.reload();
									}}
									className="flex items-center gap-2"
								>
									<svg
										className="h-4 w-4"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<title>새로고침 아이콘</title>
										<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
									</svg>
									다른 동아리 신청하기
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto mt-10 max-w-4xl px-4 py-8">
			{/* Header */}
			<div className="mb-8">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl">동아리 신청</h1>
						<p className="mt-2 text-muted-foreground">
							{steps[currentStep]?.description}
						</p>
					</div>
					<Badge variant="outline" className="text-sm">
						{currentStep + 1} / {steps.length}
					</Badge>
				</div>

				{/* Progress */}
				<div className="space-y-4">
					<Progress value={progress} className="h-2" />

					{/* Step Indicator */}
					<div className="hidden items-center justify-between md:flex">
						{steps.map((step, index) => {
							const Icon = step.icon;
							const isActive = index === currentStep;
							const isCompleted = index < currentStep;

							return (
								<div
									key={step.id}
									className="flex flex-col items-center space-y-2"
								>
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all${
											isActive
												? "border-primary bg-primary text-primary-foreground"
												: isCompleted
													? "border-green-500 bg-green-500 text-white"
													: "border-muted-foreground/30 bg-background text-muted-foreground"
										}
									`}
									>
										{isCompleted ? (
											<Icons.CheckCircle className="h-5 w-5" />
										) : (
											<Icon className="h-5 w-5" />
										)}
									</div>
									<span
										className={`max-w-20 text-center text-xs font-medium${isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"}
									`}
									>
										{step.title}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Form Content */}
			<Card className="shadow-lg">
				<CardHeader>
					<div className="flex items-center space-x-3">
						{(() => {
							const Icon = steps[currentStep]?.icon || Icons.Users;
							return <Icon className="h-6 w-6 text-primary" />;
						})()}
						<div>
							<CardTitle className="text-xl">
								{steps[currentStep]?.title}
							</CardTitle>
						</div>
					</div>
					<Separator />
				</CardHeader>
				<CardContent className="p-8">
					<FormProvider {...methods}>
						<form onSubmit={handleSubmit(onSubmit)}>
							{renderCurrentStep()}

							<Separator className="my-8" />

							<div className="flex justify-between">
								<Button
									type="button"
									variant="outline"
									onClick={prevStep}
									disabled={currentStep === 0}
									className="flex items-center gap-2"
								>
									<Icons.ArrowLeft className="h-4 w-4" />
									이전
								</Button>

								{currentStep === steps.length - 1 ? (
									<Button
										type="submit"
										disabled={!isValid || isSubmitting}
										className="flex items-center gap-2"
									>
										{isSubmitting ? (
											<>
												<div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
												제출 중...
											</>
										) : (
											<>
												<Icons.Send className="h-4 w-4" />
												신청 완료
											</>
										)}
									</Button>
								) : (
									<Button
										type="button"
										onClick={nextStep}
										disabled={currentStep === 0 && !watchedValues.clubId}
										className="flex items-center gap-2"
									>
										다음
										<Icons.ArrowRight className="h-4 w-4" />
									</Button>
								)}
							</div>
						</form>
					</FormProvider>
				</CardContent>
			</Card>
		</div>
	);
}
