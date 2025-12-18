import { convexQuery } from "@convex-dev/react-query";
import { api } from "@jwc/backend/convex/_generated/api";
import { Button } from "@jwc/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import {
	ConnectionStatus,
	Footer,
	Navbar,
	PageLayout,
} from "@/components/common";

export const Route = createFileRoute("/")({
	component: HomeComponent,
	head: () => ({
		meta: [
			{
				title: "2026 동계 청년부 수련회 - 멸종위기사랑",
			},
			{
				property: "og:title",
				content: "2026 동계 청년부 수련회 - 멸종위기사랑",
			},
		],
	}),
});

/** 수련회 정보 */
const RETREAT_INFO = {
	title: "2026 동계 청년부 수련회",
	theme: "멸종위기사랑",
	date: "2026년 1월 8일(목) ~ 1월 11일(일)",
	duration: "3박 4일",
	location: "광림 수도원",
	deadline: "2026년 1월 8일",
};

function HomeComponent() {
	const healthCheck = useQuery(convexQuery(api.healthCheck.get, {}));

	const isConnected = healthCheck.data === "OK";

	return (
		<PageLayout
			footer={<Footer />}
			header={
				<Navbar
					navSlot={
						<>
							<Link
								className="font-semibold text-foreground transition-colors"
								to="/"
							>
								홈
							</Link>
							<Link
								className="transition-colors hover:text-foreground"
								to="/about"
							>
								수련회 안내
							</Link>
						</>
					}
					rightSlot={
						<>
							<ConnectionStatus
								connectedText="신청 접수 중"
								disconnectedText="서버 점검 중"
								isConnected={isConnected}
								isLoading={healthCheck.isLoading}
								loadingText="연결 중..."
							/>
							<Button
								asChild
								className="rounded-full px-6 font-semibold"
								size="sm"
							>
								<Link params={{ step: "welcome" }} to="/onboarding/$step">
									신청하기
								</Link>
							</Button>
						</>
					}
				/>
			}
		>
			{/* Hero Section */}
			<section className="container mx-auto px-4 py-24 md:py-32">
				<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
					<div className="flex flex-col justify-center space-y-8">
						<div className="space-y-4">
							<div className="inline-flex items-center rounded-full border px-3 py-1 font-medium text-muted-foreground text-sm">
								<span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary" />
								{RETREAT_INFO.date}
							</div>
							<h1 className="font-bold text-4xl tracking-tighter sm:text-5xl xl:text-6xl/none">
								{RETREAT_INFO.title}
								<br />
								<span className="text-primary">"{RETREAT_INFO.theme}"</span>
							</h1>
							<p className="max-w-[600px] text-muted-foreground md:text-xl">
								함께 모여 예배하고 교제하며, 하나님의 사랑을 깊이 경험하는
								시간에 여러분을 초대합니다.
							</p>
						</div>
						<div className="flex flex-col gap-3 min-[400px]:flex-row">
							<Button asChild className="rounded-full px-8 text-base" size="lg">
								<Link params={{ step: "welcome" }} to="/onboarding/$step">
									지금 신청하기
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</div>
						<div className="flex items-center gap-4 text-muted-foreground text-sm">
							<div className="flex items-center gap-1">
								<MapPin className="h-4 w-4" />
								{RETREAT_INFO.location}
							</div>
							<div className="h-4 w-px bg-border" />
							<div className="flex items-center gap-1">
								<Clock className="h-4 w-4" />
								마감: {RETREAT_INFO.deadline}
							</div>
						</div>
					</div>
					<div className="relative mx-auto aspect-video w-full max-w-[600px] overflow-hidden rounded-xl border bg-muted/50 shadow-xl lg:aspect-square">
						<div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
							{/* Placeholder for Hero Image */}
							<div className="text-center">
								<Calendar className="mx-auto mb-4 h-16 w-16 opacity-20" />
								<p>수련회 포스터 / 이미지 영역</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</PageLayout>
	);
}
