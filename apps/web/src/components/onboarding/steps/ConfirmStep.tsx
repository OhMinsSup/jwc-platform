import { api } from "@jwc/backend/convex/_generated/api";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Separator,
} from "@jwc/ui";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	Calendar,
	Car,
	CheckCircle2,
	Loader2,
	Shirt,
	User,
	Users,
} from "lucide-react";
import { useState } from "react";
import { useOnboardingFormStore } from "@/lib/onboarding-form-store";

const LABELS = {
	gender: {
		male: "남성",
		female: "여성",
	},
	department: {
		youth1: "청년1부",
		youth2: "청년2부",
		other: "기타",
	},
	stayType: {
		"3nights4days": "3박 4일 (전체 참석)",
		"2nights3days": "2박 3일",
		"1night2days": "1박 2일",
		dayTrip: "무박 (당일치기)",
	},
	tfTeam: {
		none: "참여 안함",
		praise: "찬양팀",
		program: "프로그램팀",
		media: "미디어팀",
	},
	tshirtSize: {
		s: "S",
		m: "M",
		l: "L",
		xl: "XL",
		"2xl": "2XL",
		"3xl": "3XL",
	},
} as const;

export function ConfirmStep() {
	const navigate = useNavigate();
	const { formData, prevStep, nextStep } = useOnboardingFormStore();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createApplication = useMutation(api.retreatApplications.create);

	const handleGoBack = () => {
		prevStep();
		navigate({ to: "/onboarding" });
	};

	const handleSubmit = async () => {
		// 필수 필드 검증
		if (!(formData.gender && formData.department && formData.stayType)) {
			setError(
				"필수 정보가 누락되었습니다. 이전 단계로 돌아가 정보를 입력해주세요."
			);
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			await createApplication({
				name: formData.name,
				phone: formData.phone,
				gender: formData.gender,
				department: formData.department,
				ageGroup: formData.ageGroup,
				stayType: formData.stayType,
				pickupTimeDescription: formData.pickupTimeDescription,
				isPaid: false, // 초기값은 미납
				tfTeam: formData.tfTeam,
				canProvideRide: formData.canProvideRide,
				rideDetails: formData.rideDetails,
				tshirtSize: formData.tshirtSize ?? undefined,
			});

			nextStep();
			navigate({ to: "/onboarding" });
		} catch (err) {
			console.error("Failed to submit application:", err);
			setError("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<motion.div
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			initial={{ opacity: 0, x: 20 }}
			transition={{ duration: 0.3 }}
		>
			<div className="mb-8">
				<h2 className="mb-2 font-bold text-2xl">신청 내용 확인</h2>
				<p className="text-muted-foreground">
					입력하신 정보를 확인해주세요. 수정이 필요하면 이전 단계로
					돌아가주세요.
				</p>
			</div>

			<div className="space-y-4">
				{/* 개인 정보 */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<User className="h-4 w-4" />
							개인 정보
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="grid grid-cols-2 gap-y-2 text-sm">
							<span className="text-muted-foreground">이름</span>
							<span className="font-medium">{formData.name}</span>
							<span className="text-muted-foreground">연락처</span>
							<span className="font-medium">{formData.phone}</span>
							<span className="text-muted-foreground">성별</span>
							<span className="font-medium">
								{formData.gender ? LABELS.gender[formData.gender] : "-"}
							</span>
							<span className="text-muted-foreground">소속</span>
							<span className="font-medium">
								{formData.department
									? LABELS.department[formData.department]
									: "-"}
							</span>
							<span className="text-muted-foreground">연령대</span>
							<span className="font-medium">{formData.ageGroup || "-"}</span>
						</div>
					</CardContent>
				</Card>

				{/* 참석 정보 */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<Calendar className="h-4 w-4" />
							참석 정보
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="grid grid-cols-2 gap-y-2 text-sm">
							<span className="text-muted-foreground">숙박 형태</span>
							<span className="font-medium">
								{formData.stayType ? LABELS.stayType[formData.stayType] : "-"}
							</span>
						</div>
						{formData.pickupTimeDescription && (
							<div className="mt-2 rounded-md bg-muted/50 p-2 text-sm">
								<span className="text-muted-foreground">픽업/참석 시간: </span>
								{formData.pickupTimeDescription}
							</div>
						)}
					</CardContent>
				</Card>

				{/* 봉사 및 지원 */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<Users className="h-4 w-4" />
							봉사 및 지원
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="grid grid-cols-2 gap-y-2 text-sm">
							<span className="text-muted-foreground">TF팀</span>
							<span className="font-medium">
								{formData.tfTeam && formData.tfTeam !== "none"
									? LABELS.tfTeam[formData.tfTeam]
									: "참여 안함"}
							</span>
						</div>
						<Separator />
						<div className="flex items-center gap-2">
							<Car className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">
								차량 지원:{" "}
								<span className="font-medium">
									{formData.canProvideRide ? "가능" : "불가능"}
								</span>
							</span>
						</div>
						{formData.canProvideRide && formData.rideDetails && (
							<div className="rounded-md bg-muted/50 p-2 text-sm">
								{formData.rideDetails}
							</div>
						)}
					</CardContent>
				</Card>

				{/* 추가 정보 */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<Shirt className="h-4 w-4" />
							추가 정보
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-y-2 text-sm">
							<span className="text-muted-foreground">티셔츠 사이즈</span>
							<span className="font-medium">
								{formData.tshirtSize
									? LABELS.tshirtSize[formData.tshirtSize]
									: "-"}
							</span>
						</div>
					</CardContent>
				</Card>

				{/* 에러 메시지 */}
				{error && (
					<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
						{error}
					</div>
				)}

				{/* 버튼 */}
				<div className="flex justify-between pt-4">
					<Button
						className="gap-2"
						disabled={isSubmitting}
						onClick={handleGoBack}
						variant="outline"
					>
						<ArrowLeft className="h-4 w-4" />
						이전
					</Button>
					<Button
						className="gap-2"
						disabled={isSubmitting}
						onClick={handleSubmit}
					>
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								신청 중...
							</>
						) : (
							<>
								<CheckCircle2 className="h-4 w-4" />
								신청 완료
							</>
						)}
					</Button>
				</div>
			</div>
		</motion.div>
	);
}
