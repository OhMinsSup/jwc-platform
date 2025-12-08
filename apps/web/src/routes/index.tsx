import { convexQuery } from "@convex-dev/react-query";
import { api } from "@jwc/backend/convex/_generated/api";
import { Button } from "@jwc/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Clock, MapPin, Users } from "lucide-react";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

/** 수련회 정보 */
const RETREAT_INFO = {
	title: "2025 동계 청년부 수련회",
	theme: "더 나은 내일을 향해",
	date: "2025년 1월 24일(금) ~ 27일(월)",
	duration: "3박 4일",
	location: "양평 수양관",
	deadline: "2025년 1월 12일",
};

/** 특징/혜택 */
const FEATURES = [
	{
		icon: Users,
		title: "함께하는 시간",
		description: "청년부 형제자매들과 깊은 교제의 시간",
	},
	{
		icon: Calendar,
		title: "영적 충전",
		description: "말씀과 찬양으로 채워지는 은혜의 시간",
	},
	{
		icon: MapPin,
		title: "자연 속 휴식",
		description: "일상에서 벗어나 자연 속에서의 힐링",
	},
];

/** 상태 텍스트 반환 */
function getStatusText(isLoading: boolean, isConnected: boolean): string {
	if (isLoading) {
		return "연결 중...";
	}
	if (isConnected) {
		return "신청 접수 중";
	}
	return "서버 점검 중";
}

function HomeComponent() {
	const healthCheck = useQuery(convexQuery(api.healthCheck.get, {}));

	const isConnected = healthCheck.data === "OK";
	const statusColor = isConnected ? "bg-green-500" : "bg-orange-500";
	const pingColor = isConnected ? "bg-green-400" : "bg-orange-400";

	return (
		<div className="flex min-h-svh flex-col">
			{/* Hero Section */}
			<section className="relative flex flex-1 flex-col items-center justify-center px-4 py-20">
				{/* Background gradient */}
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

				<div className="relative z-10 mx-auto max-w-4xl text-center">
					{/* Badge */}
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm backdrop-blur-sm">
						<span className="relative flex h-2 w-2">
							<span
								className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${pingColor}`}
							/>
							<span
								className={`relative inline-flex h-2 w-2 rounded-full ${statusColor}`}
							/>
						</span>
						<span className="text-muted-foreground">
							{getStatusText(healthCheck.isLoading, isConnected)}
						</span>
					</div>

					{/* Title */}
					<h1 className="mb-4 font-bold text-4xl tracking-tight sm:text-5xl md:text-6xl">
						{RETREAT_INFO.title}
					</h1>

					{/* Theme */}
					<p className="mb-8 text-muted-foreground text-xl sm:text-2xl">
						"{RETREAT_INFO.theme}"
					</p>

					{/* Key Info */}
					<div className="mb-10 flex flex-wrap items-center justify-center gap-4 text-muted-foreground text-sm sm:gap-6 sm:text-base">
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4" />
							<span>{RETREAT_INFO.date}</span>
						</div>
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4" />
							<span>{RETREAT_INFO.duration}</span>
						</div>
						<div className="flex items-center gap-2">
							<MapPin className="h-4 w-4" />
							<span>{RETREAT_INFO.location}</span>
						</div>
					</div>

					{/* CTA Buttons */}
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<Button asChild className="w-full sm:w-auto" size="lg">
							<Link params={{ step: "welcome" }} to="/onboarding/$step">
								수련회 신청하기
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button
							asChild
							className="w-full sm:w-auto"
							size="lg"
							variant="outline"
						>
							<Link search={{ phoneHash: undefined }} to="/application">
								신청 내역 조회
							</Link>
						</Button>
					</div>

					{/* Deadline Notice */}
					<p className="mt-6 text-muted-foreground text-sm">
						<Clock className="mr-1 inline-block h-3 w-3" />
						신청 마감: {RETREAT_INFO.deadline}
					</p>
				</div>
			</section>

			{/* Features Section */}
			<section className="border-t bg-muted/30 px-4 py-16">
				<div className="mx-auto max-w-4xl">
					<h2 className="mb-10 text-center font-semibold text-2xl">
						수련회에서 경험하세요
					</h2>
					<div className="grid gap-6 sm:grid-cols-3">
						{FEATURES.map((feature) => (
							<div
								className="rounded-xl border bg-background p-6 text-center transition-shadow hover:shadow-md"
								key={feature.title}
							>
								<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
									<feature.icon className="h-6 w-6 text-primary" />
								</div>
								<h3 className="mb-2 font-medium">{feature.title}</h3>
								<p className="text-muted-foreground text-sm">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Steps Section */}
			<section className="px-4 py-16">
				<div className="mx-auto max-w-4xl">
					<h2 className="mb-10 text-center font-semibold text-2xl">
						신청 절차
					</h2>
					<div className="grid gap-4 sm:grid-cols-4">
						{[
							{ step: "1", title: "정보 입력", desc: "기본 정보 작성" },
							{ step: "2", title: "일정 선택", desc: "참석 일정 선택" },
							{ step: "3", title: "추가 정보", desc: "TF팀, 차량 등" },
							{ step: "4", title: "신청 완료", desc: "최종 확인" },
						].map((item, idx) => (
							<div
								className="relative flex flex-col items-center"
								key={item.step}
							>
								{idx < 3 && (
									<div className="absolute top-5 left-1/2 hidden h-0.5 w-full bg-border sm:block" />
								)}
								<div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
									{item.step}
								</div>
								<h3 className="mt-3 font-medium">{item.title}</h3>
								<p className="text-muted-foreground text-sm">{item.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t px-4 py-8">
				<div className="mx-auto max-w-4xl text-center text-muted-foreground text-sm">
					<p>© 2025 JWC Platforms. All rights reserved.</p>
					<p className="mt-1">청년부 수련회 신청 시스템</p>
				</div>
			</footer>
		</div>
	);
}
