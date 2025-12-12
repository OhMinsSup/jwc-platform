import { convexAction } from "@convex-dev/react-query";
import { api } from "@jwc/backend/convex/_generated/api";
import type { Id } from "@jwc/backend/convex/_generated/dataModel";
import {
	DEPARTMENT_LABELS,
	STAY_TYPE_LABELS,
	TF_TEAM_LABELS,
	TSHIRT_SIZE_LABELS,
} from "@jwc/schema";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@jwc/ui";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Car, CheckCircle2, User } from "lucide-react";

export const Route = createFileRoute("/application/$id")({
	component: ApplicationDetailPage,
	loader: async ({ context, params }) => {
		const { queryClient } = context;
		const id = params.id as Id<"onboarding">;
		if (!id) {
			throw notFound();
		}

		const query = convexAction(api.onboardingActions.getByIdDecrypted, { id });
		const data = await queryClient.ensureQueryData(query);
		if (!data) {
			throw notFound();
		}
		return data;
	},
	errorComponent: ({ error }) => (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background">
			<p className="text-destructive">
				{error.message || "신청 내역을 찾을 수 없습니다."}
			</p>
			<Button asChild variant="outline">
				<Link to="/application">목록으로 돌아가기</Link>
			</Button>
		</div>
	),
	pendingComponent: () => (
		<div className="flex min-h-svh items-center justify-center bg-background">
			<div className="flex flex-col items-center gap-4">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				<p className="text-muted-foreground">불러오는 중...</p>
			</div>
		</div>
	),
});

function ApplicationDetailPage() {
	const data = Route.useLoaderData();

	return (
		<div className="min-h-svh bg-background py-12">
			<div className="container mx-auto max-w-3xl px-4">
				<BackButton />
				<div className="grid gap-6">
					<Header />
					<div className="grid gap-6 md:grid-cols-2">
						<UserInfoCard />
						<ScheduleInfoCard />
						<AdditionalInfoCard />
						{data.canProvideRide && <RideInfoCard />}
					</div>
				</div>
			</div>
		</div>
	);
}

function BackButton() {
	return (
		<Button
			asChild
			className="mb-8 pl-0 hover:bg-transparent hover:text-primary"
			variant="ghost"
		>
			<Link className="flex items-center gap-2" to="/application">
				<ArrowLeft className="h-4 w-4" />
				<span>목록으로 돌아가기</span>
			</Link>
		</Button>
	);
}

function Header() {
	const data = Route.useLoaderData();

	return (
		<div className="flex items-start justify-between">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">{data.name}</h1>
				<p className="mt-1 text-muted-foreground">{data.maskedPhone}</p>
			</div>
			<div className="flex flex-col items-end gap-2">
				<Badge
					className={data.isPaid ? "bg-green-600 hover:bg-green-700" : ""}
					variant={data.isPaid ? "default" : "secondary"}
				>
					{data.isPaid ? "등록 완료" : "입금 대기"}
				</Badge>
				<span className="text-muted-foreground text-xs">
					신청일: {format(data._creationTime, "yyyy.MM.dd HH:mm")}
				</span>
			</div>
		</div>
	);
}

function UserInfoCard() {
	const data = Route.useLoaderData();

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<User aria-label="User Info" className="h-4 w-4" />
					기본 정보
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 text-sm">
				<div className="grid grid-cols-2 gap-1">
					<span className="text-muted-foreground">성별</span>
					<span className="font-medium">
						{data.gender === "male" ? "남성" : "여성"}
					</span>
				</div>
				<div className="grid grid-cols-2 gap-1">
					<span className="text-muted-foreground">부서</span>
					<span className="font-medium">
						{DEPARTMENT_LABELS[data.department]}
					</span>
				</div>
				<div className="grid grid-cols-2 gap-1">
					<span className="text-muted-foreground">또래</span>
					<span className="font-medium">{data.ageGroup}</span>
				</div>
			</CardContent>
		</Card>
	);
}

function ScheduleInfoCard() {
	const data = Route.useLoaderData();

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<Calendar aria-label="Schedule Info" className="h-4 w-4" />
					참석 일정
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 text-sm">
				<div className="grid grid-cols-2 gap-1">
					<span className="text-muted-foreground">숙박 형태</span>
					<span className="font-medium">{STAY_TYPE_LABELS[data.stayType]}</span>
				</div>
				{data.attendanceDate && (
					<div className="grid grid-cols-2 gap-1">
						<span className="text-muted-foreground">참석 날짜</span>
						<span className="font-medium">{data.attendanceDate}</span>
					</div>
				)}
				{data.pickupTimeDescription && (
					<div className="col-span-2 mt-2">
						<span className="block text-muted-foreground">
							픽업/부분참석 메모
						</span>
						<p className="mt-1 font-medium">{data.pickupTimeDescription}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function AdditionalInfoCard() {
	const data = Route.useLoaderData();
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<CheckCircle2 aria-label="Additional Info" className="h-4 w-4" />
					추가 정보
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 text-sm">
				<div className="grid grid-cols-2 gap-1">
					<span className="text-muted-foreground">TF팀 지원</span>
					<span className="font-medium">
						{data.tfTeam && data.tfTeam !== "none"
							? TF_TEAM_LABELS[data.tfTeam]
							: "지원 안함"}
					</span>
				</div>
				<div className="grid grid-cols-2 gap-1">
					<span className="text-muted-foreground">티셔츠 사이즈</span>
					<span className="font-medium">
						{data.tshirtSize ? TSHIRT_SIZE_LABELS[data.tshirtSize] : "-"}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}

function RideInfoCard() {
	const data = Route.useLoaderData();
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<Car aria-label="Ride Info" className="h-4 w-4" />
					차량 지원
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 text-sm">
				<div className="grid grid-cols-2 gap-1">
					<span className="text-muted-foreground">지원 여부</span>
					<span className="font-medium text-green-600">가능</span>
				</div>
				{data.rideDetails && (
					<div className="col-span-2 mt-2">
						<span className="block text-muted-foreground">상세 내용</span>
						<p className="mt-1 font-medium">{data.rideDetails}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
