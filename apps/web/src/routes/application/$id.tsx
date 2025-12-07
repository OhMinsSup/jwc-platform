import { convexQuery } from "@convex-dev/react-query";
import { api } from "@jwc/backend/convex/_generated/api";
import type { Id } from "@jwc/backend/convex/_generated/dataModel";
import {
	DEPARTMENT_LABELS,
	GENDER_LABELS,
	STAY_TYPE_LABELS,
	TF_TEAM_LABELS,
	TSHIRT_SIZE_LABELS,
} from "@jwc/schema";
import { Button, cn } from "@jwc/ui";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	Calendar,
	CheckCircle,
	Clock,
	Home,
	Loader2,
	Lock,
	Shirt,
	User,
	Users,
	XCircle,
} from "lucide-react";

export const Route = createFileRoute("/application/$id")({
	loader: async (opts) => {
		const { id } = opts.params;
		if (!id) {
			throw redirect({
				to: "/onboarding",
			});
		}

		const query = convexQuery(api.onboarding.getById, {
			id: id as Id<"onboarding">,
		});

		await opts.context.queryClient.ensureQueryData(query);
	},
	component: ApplicationDetailPage,
	errorComponent: ApplicationErrorComponent,
	pendingComponent: LoadingState,
});

const containerVariants: Variants = {
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

interface InfoRowProps {
	label: string;
	value: string | undefined;
}

function InfoRow({ label, value }: InfoRowProps) {
	return (
		<div className="flex justify-between border-border/30 border-b py-3 last:border-0">
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
}

function InfoCard({ icon, title, children }: InfoCardProps) {
	return (
		<motion.div
			className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm"
			variants={itemVariants}
		>
			<div className="flex items-center gap-3 border-border/30 border-b bg-muted/30 px-5 py-4">
				<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm">
					{icon}
				</div>
				<span className="font-semibold text-foreground">{title}</span>
			</div>
			<div className="px-5 py-2">{children}</div>
		</motion.div>
	);
}

interface DecryptedOnboarding {
	_id: Id<"onboarding">;
	_creationTime: number;
	name: string;
	phone: string;
	gender: "male" | "female";
	department: "youth1" | "youth2" | "other";
	ageGroup: string;
	stayType: "3nights4days" | "2nights3days" | "1night2days" | "dayTrip";
	attendanceDate?: string;
	pickupTimeDescription?: string;
	isPaid: boolean;
	tfTeam?: "none" | "praise" | "program" | "media";
	canProvideRide?: boolean;
	rideDetails?: string;
	tshirtSize?: "s" | "m" | "l" | "xl" | "2xl" | "3xl";
}

function LoadingState() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="text-muted-foreground">신청서를 불러오는 중...</p>
			</div>
		</div>
	);
}

function ApplicationErrorComponent() {
	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="flex flex-col items-center gap-4 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
					<XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
				</div>
				<h1 className="font-bold text-xl">신청서를 찾을 수 없습니다</h1>
				<p className="text-muted-foreground">
					요청하신 신청서가 존재하지 않거나 삭제되었습니다.
				</p>
				<Button asChild className="mt-4">
					<Link to="/">
						<Home className="mr-2 h-4 w-4" />
						홈으로 돌아가기
					</Link>
				</Button>
			</div>
		</div>
	);
}

interface StatusHeaderProps {
	data: DecryptedOnboarding | null;
	ssrData: {
		_creationTime: number;
		isPaid: boolean;
	};
	isDecrypting: boolean;
}

function StatusHeader({ data, ssrData, isDecrypting }: StatusHeaderProps) {
	const createdAt = new Date(ssrData._creationTime);
	const displayName = data?.name ?? "로딩 중...";
	const displayPhone = data?.phone ?? "***-****-****";

	return (
		<motion.div
			className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
			variants={itemVariants}
		>
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-4">
					<div
						className={cn(
							"flex h-14 w-14 items-center justify-center rounded-2xl",
							ssrData.isPaid
								? "bg-green-100 dark:bg-green-950"
								: "bg-amber-100 dark:bg-amber-950"
						)}
					>
						{ssrData.isPaid ? (
							<CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
						) : (
							<Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
						)}
					</div>
					<div>
						<h2 className="flex items-center gap-2 font-bold text-xl">
							{displayName}
							{isDecrypting && (
								<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
							)}
						</h2>
						<p className="flex items-center gap-1.5 text-muted-foreground text-sm">
							{!data && <Lock className="h-3 w-3" />}
							{displayPhone}
						</p>
					</div>
				</div>
				<div
					className={cn(
						"rounded-full px-3 py-1 font-medium text-xs",
						ssrData.isPaid
							? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
							: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
					)}
				>
					{ssrData.isPaid ? "납입 완료" : "납입 대기"}
				</div>
			</div>
			<div className="mt-4 flex items-center gap-2 text-muted-foreground text-xs">
				<Calendar className="h-3.5 w-3.5" />
				<span>
					신청일:{" "}
					{format(createdAt, "yyyy년 M월 d일 (EEE) HH:mm", {
						locale: ko,
					})}
				</span>
			</div>
		</motion.div>
	);
}

interface OnboardingData {
	_id: Id<"onboarding">;
	_creationTime: number;
	name: string;
	phone: string;
	phoneHash: string;
	gender: "male" | "female";
	department: "youth1" | "youth2" | "other";
	ageGroup: string;
	stayType: "3nights4days" | "2nights3days" | "1night2days" | "dayTrip";
	attendanceDate?: string;
	pickupTimeDescription?: string;
	isPaid: boolean;
	tfTeam?: "none" | "praise" | "program" | "media";
	canProvideRide?: boolean;
	rideDetails?: string;
	tshirtSize?: "s" | "m" | "l" | "xl" | "2xl" | "3xl";
}

interface ApplicationContentProps {
	ssrData: OnboardingData;
	decryptedData: DecryptedOnboarding | null;
	isDecrypting: boolean;
}

function ApplicationContent({
	ssrData,
	decryptedData,
	isDecrypting,
}: ApplicationContentProps) {
	const displayName = decryptedData?.name ?? "●●●";
	const displayPhone = decryptedData?.phone ?? "***-****-****";

	return (
		<motion.div
			animate="visible"
			className="space-y-6"
			initial="hidden"
			variants={containerVariants}
		>
			<StatusHeader
				data={decryptedData}
				isDecrypting={isDecrypting}
				ssrData={ssrData}
			/>

			{/* 개인 정보 */}
			<InfoCard
				icon={<User className="h-4 w-4 text-primary" />}
				title="개인 정보"
			>
				<div className="flex justify-between border-border/30 border-b py-3">
					<span className="text-muted-foreground text-sm">이름</span>
					<span className="flex items-center gap-2 font-medium text-foreground text-sm">
						{!decryptedData && (
							<Lock className="h-3 w-3 text-muted-foreground" />
						)}
						{displayName}
						{isDecrypting && (
							<Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
						)}
					</span>
				</div>
				<div className="flex justify-between border-border/30 border-b py-3">
					<span className="text-muted-foreground text-sm">연락처</span>
					<span className="flex items-center gap-2 font-medium text-foreground text-sm">
						{!decryptedData && (
							<Lock className="h-3 w-3 text-muted-foreground" />
						)}
						{displayPhone}
					</span>
				</div>
				<InfoRow label="성별" value={GENDER_LABELS[ssrData.gender]} />
				<InfoRow label="소속" value={DEPARTMENT_LABELS[ssrData.department]} />
				<InfoRow label="연령대" value={ssrData.ageGroup} />
			</InfoCard>

			{/* 참석 정보 */}
			<InfoCard
				icon={<Calendar className="h-4 w-4 text-primary" />}
				title="참석 정보"
			>
				<InfoRow label="숙박 형태" value={STAY_TYPE_LABELS[ssrData.stayType]} />
				{ssrData.stayType !== "3nights4days" && (
					<>
						{ssrData.attendanceDate && (
							<InfoRow
								label="참석 일시"
								value={format(
									parseISO(ssrData.attendanceDate),
									"yyyy년 M월 d일 (EEE) HH:mm",
									{ locale: ko }
								)}
							/>
						)}
						{ssrData.pickupTimeDescription && (
							<InfoRow
								label="픽업 시간"
								value={ssrData.pickupTimeDescription}
							/>
						)}
					</>
				)}
			</InfoCard>

			{/* 봉사 및 지원 */}
			<InfoCard
				icon={<Users className="h-4 w-4 text-primary" />}
				title="봉사 및 지원"
			>
				<InfoRow
					label="TF팀"
					value={
						ssrData.tfTeam && ssrData.tfTeam !== "none"
							? TF_TEAM_LABELS[ssrData.tfTeam]
							: "참여 안함"
					}
				/>
				<InfoRow
					label="차량 지원"
					value={ssrData.canProvideRide ? "가능" : "불가능"}
				/>
				{ssrData.canProvideRide && ssrData.rideDetails && (
					<InfoRow label="차량 정보" value={ssrData.rideDetails} />
				)}
			</InfoCard>

			{/* 추가 정보 */}
			<InfoCard
				icon={<Shirt className="h-4 w-4 text-primary" />}
				title="추가 정보"
			>
				<InfoRow
					label="티셔츠 사이즈"
					value={
						ssrData.tshirtSize
							? TSHIRT_SIZE_LABELS[ssrData.tshirtSize]
							: "미선택"
					}
				/>
			</InfoCard>

			{/* 하단 버튼 */}
			<motion.div className="pt-4" variants={itemVariants}>
				<Button asChild className="w-full" size="lg" variant="outline">
					<Link to="/onboarding">
						<Home className="mr-2 h-4 w-4" />
						홈으로 돌아가기
					</Link>
				</Button>
			</motion.div>
		</motion.div>
	);
}

function ApplicationDetailPage() {
	const { id } = Route.useParams();
	const getByIdDecrypted = useAction(api.onboardingActions.getByIdDecrypted);

	// SSR: 암호화된 데이터 (즉시 렌더링)
	const { data: ssrData } = useSuspenseQuery(
		convexQuery(api.onboarding.getById, { id: id as Id<"onboarding"> })
	);

	// 클라이언트: 복호화된 데이터 (React Query로 관리)
	const { data: decryptedData, isLoading: isDecrypting } = useQuery({
		queryKey: ["decrypted-onboarding", id],
		queryFn: () => getByIdDecrypted({ id: id as Id<"onboarding"> }),
		staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
		gcTime: 1000 * 60 * 10, // 10분간 가비지 컬렉션 방지
		refetchOnWindowFocus: false,
	});

	if (!ssrData) {
		throw new Error("Application not found");
	}

	return (
		<div className="bg-gradient-to-b from-background to-muted/20">
			{/* 헤더 */}
			<header className="sticky top-0 z-50 border-border/40 border-b bg-background/80 backdrop-blur-lg">
				<div className="container mx-auto flex h-14 max-w-2xl items-center px-4">
					<Button asChild size="icon" variant="ghost">
						<Link to="/">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<h1 className="ml-2 font-semibold">신청서 상세</h1>
				</div>
			</header>

			<main className="container mx-auto max-w-2xl px-4 py-8">
				<ApplicationContent
					decryptedData={decryptedData ?? null}
					isDecrypting={isDecrypting}
					ssrData={ssrData}
				/>
			</main>
		</div>
	);
}
