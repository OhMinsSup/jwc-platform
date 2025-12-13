import { convexQuery } from "@convex-dev/react-query";
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
import { ko } from "date-fns/locale";
import { ArrowLeft, Calendar, Car, CheckCircle2, User } from "lucide-react";
import {
	FullPageLoading,
	InfoBlock,
	InfoGrid,
	InfoRow,
} from "@/components/common";

export const Route = createFileRoute("/application/$id")({
	component: ApplicationDetailPage,
	loader: async ({ context, params }) => {
		const { queryClient } = context;
		const id = params.id as Id<"onboarding">;
		if (!id) {
			throw notFound();
		}

		// SSR 적용: convexQuery 사용
		const query = convexQuery(api.onboarding.getById, { id });
		const data = await queryClient.ensureQueryData(query);
		if (!data) {
			throw notFound();
		}
		return data;
	},
	head: ({ loaderData }) => {
		if (!loaderData) {
			return { meta: [] };
		}
		return {
			meta: [
				{
					title: `${loaderData.name}님의 수련회 신청서 - 2026 동계 청년부 수련회`,
				},
				{
					property: "og:title",
					content: `${loaderData.name}님의 수련회 신청서 - 2026 동계 청년부 수련회`,
				},
				{
					name: "description",
					content: `${loaderData.name}님의 2026 동계 청년부 수련회 신청 내역입니다.`,
				},
				{
					property: "og:description",
					content: `${loaderData.name}님의 2026 동계 청년부 수련회 신청 내역입니다.`,
				},
			],
		};
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
	pendingComponent: () => <FullPageLoading message="불러오는 중..." />,
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
				{/* 전화번호 노출 제거 */}
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
			<CardContent>
				<InfoGrid>
					<InfoRow
						label="성별"
						value={data.gender === "male" ? "남성" : "여성"}
					/>
					<InfoRow label="부서" value={DEPARTMENT_LABELS[data.department]} />
					<InfoRow label="또래" value={data.ageGroup} />
				</InfoGrid>
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
			<CardContent>
				<InfoGrid>
					<InfoRow label="숙박 형태" value={STAY_TYPE_LABELS[data.stayType]} />
					{data.attendanceDate && (
						<InfoRow
							label="참석 날짜"
							value={format(
								new Date(data.attendanceDate),
								"yyyy년 M월 d일 a h시",
								{ locale: ko }
							)}
						/>
					)}
					{data.pickupTimeDescription && (
						<InfoBlock
							label="픽업/부분참석 메모"
							value={data.pickupTimeDescription}
						/>
					)}
				</InfoGrid>
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
			<CardContent>
				<InfoGrid>
					<InfoRow
						label="TF팀 지원"
						value={
							data.tfTeam && data.tfTeam !== "none"
								? TF_TEAM_LABELS[data.tfTeam]
								: "지원 안함"
						}
					/>
					<InfoRow
						label="티셔츠 사이즈"
						value={data.tshirtSize ? TSHIRT_SIZE_LABELS[data.tshirtSize] : "-"}
					/>
				</InfoGrid>
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
			<CardContent>
				<InfoGrid>
					<InfoRow
						label="지원 여부"
						value={<span className="text-green-600">가능</span>}
					/>
					{data.rideDetails && (
						<InfoBlock label="상세 내용" value={data.rideDetails} />
					)}
				</InfoGrid>
			</CardContent>
		</Card>
	);
}
