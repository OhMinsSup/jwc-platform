import { api } from "@jwc/backend/convex/_generated/api";
import type { Id } from "@jwc/backend/convex/_generated/dataModel";
import {
	DEPARTMENT_LABELS,
	type Department,
	STAY_TYPE_LABELS,
} from "@jwc/schema";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@jwc/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { format } from "date-fns";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import {
	CheckCircle2,
	Clock,
	CreditCard,
	Loader2,
	Search,
	Users,
} from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 20;

interface ApplicationSearchParams {
	q?: string;
	department?: Department;
}

export const Route = createFileRoute("/application/")({
	component: ApplicationListPage,
	validateSearch: (
		search: Record<string, unknown>
	): ApplicationSearchParams => ({
		q: typeof search.q === "string" ? search.q : undefined,
		department:
			search.department === "youth1" ||
			search.department === "youth2" ||
			search.department === "other"
				? search.department
				: undefined,
	}),
});

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.05, delayChildren: 0.1 },
	},
};

interface OnboardingListItem {
	_id: Id<"onboarding">;
	_creationTime: number;
	name: string;
	gender: "male" | "female";
	department: "youth1" | "youth2" | "other";
	ageGroup: string;
	stayType: "3nights4days" | "2nights3days" | "1night2days" | "dayTrip";
	isPaid: boolean;
	tfTeam?: "none" | "praise" | "program" | "media";
	tshirtSize?: "s" | "m" | "l" | "xl" | "2xl" | "3xl";
}

function ApplicationListPage() {
	const navigate = useNavigate();
	const { q, department } = Route.useSearch();

	// 로컬 입력 상태 (디바운스용)
	const [inputValue, setInputValue] = useState(q ?? "");

	// usePaginatedQuery 사용 (URL의 search params 기반)
	const { results, status, loadMore, isLoading } = usePaginatedQuery(
		api.onboarding.searchOnboardings,
		{
			searchQuery: q || undefined,
			department,
		},
		{ initialNumItems: PAGE_SIZE }
	);

	// URL search params와 입력값 동기화
	useEffect(() => {
		setInputValue(q ?? "");
	}, [q]);

	// 디바운스된 검색어 URL 업데이트
	useEffect(() => {
		const timer = setTimeout(() => {
			if (inputValue !== (q ?? "")) {
				startTransition(() => {
					navigate({
						to: "/application",
						search: (prev) => ({
							...prev,
							q: inputValue || undefined,
						}),
						replace: true,
					});
				});
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [inputValue, q, navigate]);

	// 부서 필터 변경 핸들러
	const handleDepartmentChange = (value: string) => {
		startTransition(() => {
			navigate({
				to: "/application",
				search: (prev) => ({
					...prev,
					department: value === "all" ? undefined : (value as Department),
				}),
				replace: true,
			});
		});
	};

	// 데이터 타입 캐스팅
	const data = results as OnboardingListItem[];

	// 통계 계산
	const { totalCount, paidCount, pendingCount } = useMemo(() => {
		const total = data.length;
		const paid = data.filter((item) => item.isPaid).length;
		return {
			totalCount: total,
			paidCount: paid,
			pendingCount: total - paid,
		};
	}, [data]);

	// 로딩 상태 계산
	const isLoadingFirstPage = status === "LoadingFirstPage";
	const canLoadMore = status === "CanLoadMore";
	const isLoadingMore = status === "LoadingMore";

	return (
		<div className="flex min-h-svh flex-col bg-muted/5">
			{/* Navbar */}
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto flex h-16 items-center justify-between px-4">
					<Link
						className="flex items-center gap-2 font-bold text-xl tracking-tight"
						to="/"
					>
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<svg
								className="h-5 w-5"
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<title>JWC Retreat Logo</title>
								<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
							</svg>
						</div>
						<span>JWC Retreat</span>
					</Link>
					<nav className="hidden items-center gap-6 font-medium text-muted-foreground text-sm md:flex">
						<Link className="transition-colors hover:text-foreground" to="/">
							홈
						</Link>
						<Link
							className="text-foreground transition-colors hover:text-foreground"
							to="/application"
						>
							신청 내역 조회
						</Link>
					</nav>
					<div className="flex items-center gap-4">
						<Button
							asChild
							className="rounded-full px-6 font-semibold"
							size="sm"
						>
							<Link params={{ step: "welcome" }} to="/onboarding/$step">
								신청하기
							</Link>
						</Button>
					</div>
				</div>
			</header>

			<main className="flex-1 py-8 md:py-12">
				<div className="container mx-auto max-w-6xl px-4">
					<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<h1 className="font-bold text-3xl tracking-tight">
								신청 내역 조회
							</h1>
							<p className="mt-2 text-muted-foreground">
								등록된 수련회 신청 내역을 실시간으로 확인하세요.
							</p>
						</div>
						<Button
							className="self-start md:self-auto"
							disabled={isLoading}
							onClick={() => window.location.reload()}
							size="sm"
							variant="outline"
						>
							{isLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Clock className="mr-2 h-4 w-4" />
							)}
							새로고침
						</Button>
					</div>

					{/* Stats Cards */}
					<div className="mb-8 grid gap-4 sm:grid-cols-3">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">총 신청자</CardTitle>
								<Users className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{totalCount}명</div>
								<p className="text-muted-foreground text-xs">
									현재까지 접수된 인원
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">등록 완료</CardTitle>
								<CheckCircle2 className="h-4 w-4 text-green-500" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{paidCount}명</div>
								<p className="text-muted-foreground text-xs">
									입금 확인된 인원
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">입금 대기</CardTitle>
								<CreditCard className="h-4 w-4 text-orange-500" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{pendingCount}명</div>
								<p className="text-muted-foreground text-xs">
									입금 확인 중인 인원
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Filters */}
					<div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center">
						<div className="relative flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								className="pl-9"
								onChange={(e) => setInputValue(e.target.value)}
								placeholder="이름으로 검색"
								value={inputValue}
							/>
						</div>
						<div className="w-full md:w-[200px]">
							<Select
								onValueChange={handleDepartmentChange}
								value={department ?? "all"}
							>
								<SelectTrigger>
									<SelectValue placeholder="부서 선택" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">전체 부서</SelectItem>
									<SelectItem value="youth1">청년1부</SelectItem>
									<SelectItem value="youth2">청년2부</SelectItem>
									<SelectItem value="other">기타</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Results */}
					<motion.div
						animate="visible"
						className="space-y-4"
						initial="hidden"
						variants={containerVariants}
					>
						{isLoadingFirstPage && (
							<div className="flex h-64 items-center justify-center rounded-xl border bg-card/50">
								<div className="flex flex-col items-center gap-2 text-muted-foreground">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
									<p>데이터를 불러오는 중입니다...</p>
								</div>
							</div>
						)}

						{!isLoadingFirstPage && data.length === 0 && (
							<div className="flex h-64 items-center justify-center rounded-xl border bg-card/50">
								<div className="flex flex-col items-center gap-2 text-muted-foreground">
									<Search className="h-8 w-8 opacity-50" />
									<p>검색 결과가 없습니다.</p>
								</div>
							</div>
						)}

						{!isLoadingFirstPage && data.length > 0 && (
							<>
								{/* Mobile View: Cards */}
								<div className="grid gap-4 md:hidden">
									{data.map((item) => (
										<Card
											className="cursor-pointer transition-colors hover:bg-muted/50"
											key={item._id}
											onClick={() =>
												navigate({
													to: "/application/$id",
													params: { id: item._id },
												})
											}
										>
											<CardHeader className="pb-2">
												<div className="flex items-start justify-between">
													<CardTitle className="text-base">
														{item.name}
													</CardTitle>
													{item.isPaid ? (
														<Badge
															className="bg-green-500/10 text-green-600 hover:bg-green-500/20"
															variant="secondary"
														>
															등록 완료
														</Badge>
													) : (
														<Badge
															className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
															variant="secondary"
														>
															입금 대기
														</Badge>
													)}
												</div>
											</CardHeader>
											<CardContent className="pb-2 text-sm">
												<div className="grid grid-cols-2 gap-2">
													<div className="flex flex-col gap-1">
														<span className="text-muted-foreground text-xs">
															부서/또래
														</span>
														<span className="font-medium">
															{DEPARTMENT_LABELS[item.department]} /{" "}
															{item.ageGroup}
														</span>
													</div>
													<div className="flex flex-col gap-1">
														<span className="text-muted-foreground text-xs">
															일정
														</span>
														<span className="font-medium">
															{STAY_TYPE_LABELS[item.stayType]}
														</span>
													</div>
												</div>
											</CardContent>
											<CardFooter className="pt-2 text-muted-foreground text-xs">
												신청일: {format(item._creationTime, "yyyy.MM.dd HH:mm")}
											</CardFooter>
										</Card>
									))}
								</div>

								{/* Desktop View: Table */}
								<div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
									<Table>
										<TableHeader>
											<TableRow className="bg-muted/50 hover:bg-muted/50">
												<TableHead className="w-[120px]">이름</TableHead>
												<TableHead>부서/또래</TableHead>
												<TableHead>참석 일정</TableHead>
												<TableHead className="text-center">상태</TableHead>
												<TableHead className="text-right">신청일</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{data.map((item) => (
												<TableRow
													className="cursor-pointer hover:bg-muted/50"
													key={item._id}
													onClick={() =>
														navigate({
															to: "/application/$id",
															params: { id: item._id },
														})
													}
												>
													<TableCell>
														<span className="font-medium">{item.name}</span>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2">
															<Badge className="font-normal" variant="outline">
																{DEPARTMENT_LABELS[item.department]}
															</Badge>
															<span className="text-muted-foreground text-sm">
																{item.ageGroup}
															</span>
														</div>
													</TableCell>
													<TableCell>
														<span className="text-sm">
															{STAY_TYPE_LABELS[item.stayType]}
														</span>
													</TableCell>
													<TableCell className="text-center">
														{item.isPaid ? (
															<Badge
																className="bg-green-500/10 text-green-600 hover:bg-green-500/20"
																variant="secondary"
															>
																등록 완료
															</Badge>
														) : (
															<Badge
																className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
																variant="secondary"
															>
																입금 대기
															</Badge>
														)}
													</TableCell>
													<TableCell className="text-right text-muted-foreground text-sm">
														{format(item._creationTime, "yyyy.MM.dd HH:mm")}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>

								{/* Load More Button */}
								{canLoadMore && (
									<div className="flex justify-center pt-4">
										<Button
											disabled={isLoadingMore}
											onClick={() => loadMore(PAGE_SIZE)}
											variant="outline"
										>
											{isLoadingMore ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													불러오는 중...
												</>
											) : (
												"더 보기"
											)}
										</Button>
									</div>
								)}
							</>
						)}
					</motion.div>
				</div>
			</main>
		</div>
	);
}
