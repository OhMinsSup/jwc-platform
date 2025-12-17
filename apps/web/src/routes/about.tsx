import { Button } from "@jwc/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BookOpen,
	Calendar,
	CheckCircle2,
	Clock,
	Heart,
	MapPin,
	Music,
	Sparkles,
	Users,
} from "lucide-react";
import { Footer, Navbar, PageLayout } from "@/components/common";

export const Route = createFileRoute("/about")({
	component: AboutPage,
	head: () => ({
		meta: [
			{
				title: "수련회 안내 - 2026 동계 청년부 수련회",
			},
			{
				name: "description",
				content:
					"2026년 동계 청년부 수련회의 일정, 장소, 프로그램 등 상세 정보를 확인하세요.",
			},
			{
				property: "og:title",
				content: "수련회 안내 - 2026 동계 청년부 수련회",
			},
		],
	}),
});

/** 수련회 기본 정보 */
const RETREAT_INFO = {
	title: "2026 동계 청년부 수련회",
	theme: "멸종위기사랑",
	themeVerse: "사랑은 언제까지나 떨어지지 아니하되 (고린도전서 13:8)",
	date: "2026년 1월 8일(목) ~ 1월 11일(일)",
	duration: "3박 4일",
	location: "광림 수도원",
	address: "경기도 양평군 용문면 광림로 1",
	deadline: "2026년 1월 8일",
	cost: {
		regular: "150,000원",
		student: "120,000원",
	},
};

/** 일정 프로그램 */
const SCHEDULE = [
	{
		day: "첫째 날",
		date: "1월 8일 (목)",
		events: [
			{ time: "14:00", title: "등록 및 입실" },
			{ time: "16:00", title: "오리엔테이션" },
			{ time: "18:00", title: "저녁식사" },
			{ time: "19:30", title: "개회예배" },
			{ time: "21:30", title: "조별 모임" },
		],
	},
	{
		day: "둘째 날",
		date: "1월 9일 (금)",
		events: [
			{ time: "07:00", title: "아침묵상" },
			{ time: "08:00", title: "아침식사" },
			{ time: "10:00", title: "오전집회" },
			{ time: "12:00", title: "점심식사" },
			{ time: "14:00", title: "레크레이션" },
			{ time: "18:00", title: "저녁식사" },
			{ time: "19:30", title: "저녁집회" },
			{ time: "21:30", title: "조별 모임" },
		],
	},
	{
		day: "셋째 날",
		date: "1월 10일 (토)",
		events: [
			{ time: "07:00", title: "아침묵상" },
			{ time: "08:00", title: "아침식사" },
			{ time: "10:00", title: "오전집회" },
			{ time: "12:00", title: "점심식사" },
			{ time: "14:00", title: "자유시간 / 야외활동" },
			{ time: "18:00", title: "저녁식사" },
			{ time: "19:30", title: "저녁집회" },
			{ time: "21:30", title: "친교의 밤" },
		],
	},
	{
		day: "마지막 날",
		date: "1월 11일 (일)",
		events: [
			{ time: "07:00", title: "아침묵상" },
			{ time: "08:00", title: "아침식사" },
			{ time: "10:00", title: "폐회예배" },
			{ time: "12:00", title: "점심식사 및 퇴실" },
		],
	},
];

/** 프로그램 특징 */
const PROGRAMS = [
	{
		icon: BookOpen,
		title: "말씀 강해",
		description: "'멸종위기사랑'을 주제로 한 깊이 있는 말씀 강해와 적용의 시간",
	},
	{
		icon: Music,
		title: "찬양과 경배",
		description: "찬양팀과 함께하는 뜨거운 찬양과 경배의 시간",
	},
	{
		icon: Users,
		title: "조별 모임",
		description: "소그룹으로 나누어 말씀을 나누고 기도하는 시간",
	},
	{
		icon: Heart,
		title: "친교의 시간",
		description: "청년부 형제자매들과 깊은 교제를 나누는 시간",
	},
	{
		icon: Sparkles,
		title: "레크레이션",
		description: "다양한 게임과 활동으로 함께 즐기는 시간",
	},
	{
		icon: Clock,
		title: "아침묵상",
		description: "고요한 아침, 하나님과 교제하는 개인 묵상 시간",
	},
];

/** 준비물 목록 */
const CHECKLIST = [
	"성경, 찬송가",
	"필기도구",
	"세면도구 및 개인 위생용품",
	"편한 옷 및 잠옷",
	"따뜻한 외투 (야외활동용)",
	"운동화 또는 편한 신발",
	"상비약 (개인 필요시)",
	"신분증",
];

function AboutPage() {
	return (
		<PageLayout
			footer={<Footer />}
			header={
				<Navbar
					navSlot={
						<>
							<Link className="transition-colors hover:text-foreground" to="/">
								홈
							</Link>
							<Link
								className="font-semibold text-foreground transition-colors"
								to="/about"
							>
								수련회 안내
							</Link>
						</>
					}
					rightSlot={
						<Button
							asChild
							className="rounded-full px-6 font-semibold"
							size="sm"
						>
							<Link params={{ step: "welcome" }} to="/onboarding/$step">
								신청하기
							</Link>
						</Button>
					}
				/>
			}
		>
			{/* Hero Section */}
			<section className="border-b bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-3xl text-center">
						<div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 font-medium text-primary text-sm">
							<Calendar className="mr-2 h-4 w-4" />
							{RETREAT_INFO.date}
						</div>
						<h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl">
							{RETREAT_INFO.title}
						</h1>
						<p className="mb-2 font-semibold text-2xl text-primary md:text-3xl">
							"{RETREAT_INFO.theme}"
						</p>
						<p className="text-muted-foreground md:text-lg">
							{RETREAT_INFO.themeVerse}
						</p>
					</div>
				</div>
			</section>

			{/* 기본 정보 */}
			<section className="py-16 md:py-24">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-4xl">
						<h2 className="mb-12 text-center font-bold text-3xl tracking-tight">
							수련회 정보
						</h2>
						<div className="grid gap-6 md:grid-cols-2">
							<div className="group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg">
								<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Calendar className="h-6 w-6" />
								</div>
								<h3 className="mb-2 font-semibold text-lg">일시</h3>
								<p className="text-muted-foreground">{RETREAT_INFO.date}</p>
								<p className="text-muted-foreground text-sm">
									({RETREAT_INFO.duration})
								</p>
							</div>
							<div className="group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg">
								<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<MapPin className="h-6 w-6" />
								</div>
								<h3 className="mb-2 font-semibold text-lg">장소</h3>
								<p className="text-muted-foreground">{RETREAT_INFO.location}</p>
								<p className="text-muted-foreground text-sm">
									{RETREAT_INFO.address}
								</p>
							</div>
							<div className="group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg">
								<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Clock className="h-6 w-6" />
								</div>
								<h3 className="mb-2 font-semibold text-lg">신청 마감</h3>
								<p className="text-muted-foreground">{RETREAT_INFO.deadline}</p>
								<p className="text-muted-foreground text-sm">
									마감일까지 신청 및 입금 완료 필수
								</p>
							</div>
							<div className="group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg">
								<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Heart className="h-6 w-6" />
								</div>
								<h3 className="mb-2 font-semibold text-lg">참가비</h3>
								<p className="text-muted-foreground">
									일반: {RETREAT_INFO.cost.regular}
								</p>
								<p className="text-muted-foreground text-sm">
									학생: {RETREAT_INFO.cost.student}
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* 프로그램 */}
			<section className="border-t bg-muted/40 py-16 md:py-24">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<div className="mb-12 text-center">
							<h2 className="mb-4 font-bold text-3xl tracking-tight">
								프로그램 소개
							</h2>
							<p className="text-muted-foreground md:text-lg">
								다양한 프로그램을 통해 영적으로 충전되는 시간을 경험하세요.
							</p>
						</div>
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{PROGRAMS.map((program, index) => (
								<div
									className="group rounded-2xl border bg-background p-6 transition-all hover:shadow-lg"
									key={`program:${index.toString()}`}
								>
									<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
										<program.icon className="h-6 w-6" />
									</div>
									<h3 className="mb-2 font-semibold text-lg">
										{program.title}
									</h3>
									<p className="text-muted-foreground text-sm">
										{program.description}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* 일정표 */}
			<section className="py-16 md:py-24">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<div className="mb-12 text-center">
							<h2 className="mb-4 font-bold text-3xl tracking-tight">
								상세 일정
							</h2>
							<p className="text-muted-foreground md:text-lg">
								3박 4일간의 수련회 일정을 확인하세요.
							</p>
						</div>
						<div className="grid gap-6 lg:grid-cols-2">
							{SCHEDULE.map((day, dayIndex) => (
								<div
									className="overflow-hidden rounded-2xl border bg-card"
									key={`day:${dayIndex.toString()}`}
								>
									<div className="border-b bg-primary/5 px-6 py-4">
										<h3 className="font-bold text-lg">{day.day}</h3>
										<p className="text-muted-foreground text-sm">{day.date}</p>
									</div>
									<div className="divide-y">
										{day.events.map((event, eventIndex) => (
											<div
												className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/50"
												key={`event:${dayIndex}-${eventIndex.toString()}`}
											>
												<span className="w-14 shrink-0 font-mono text-muted-foreground text-sm">
													{event.time}
												</span>
												<span className="font-medium">{event.title}</span>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
						<p className="mt-6 text-center text-muted-foreground text-sm">
							* 일정은 상황에 따라 변경될 수 있습니다.
						</p>
					</div>
				</div>
			</section>

			{/* 준비물 */}
			<section className="border-t bg-muted/40 py-16 md:py-24">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-2xl">
						<div className="mb-12 text-center">
							<h2 className="mb-4 font-bold text-3xl tracking-tight">
								준비물 체크리스트
							</h2>
							<p className="text-muted-foreground md:text-lg">
								수련회 참석을 위해 준비해 주세요.
							</p>
						</div>
						<div className="rounded-2xl border bg-background p-6 md:p-8">
							<ul className="grid gap-3 sm:grid-cols-2">
								{CHECKLIST.map((item, index) => (
									<li
										className="flex items-center gap-3"
										key={`checklist:${index.toString()}`}
									>
										<CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-16 md:py-24">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-2xl rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-primary/5 p-8 text-center md:p-12">
						<h2 className="mb-4 font-bold text-2xl md:text-3xl">
							함께 은혜 받을 준비 되셨나요?
						</h2>
						<p className="mb-8 text-muted-foreground">
							지금 바로 신청하시고, 특별한 수련회에 함께하세요!
						</p>
						<div className="flex flex-col justify-center gap-3 sm:flex-row">
							<Button asChild className="rounded-full px-8" size="lg">
								<Link params={{ step: "welcome" }} to="/onboarding/$step">
									신청하기
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</PageLayout>
	);
}
