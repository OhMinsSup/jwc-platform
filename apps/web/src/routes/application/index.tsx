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
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
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
import {
	ContentLoading,
	EmptyState,
	Navbar,
	PageContainer,
	PageHeader,
	PageLayout,
	PaymentStatusBadge,
	StatCard,
	StatGrid,
} from "@/components/common";

const PAGE_SIZE = 20;

interface ApplicationSearchParams {
	q?: string;
	department?: Department;
}

export const Route = createFileRoute("/application/")({
	component: ApplicationListPage,
	loader: () => {
		throw redirect({
			to: "/",
		});
	},
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
		<PageLayout
			header={
				<Navbar
					navSlot={
						<>
							<Link className="transition-colors hover:text-foreground" to="/">
								홈
							</Link>
							<Link
								className="text-foreground transition-colors hover:text-foreground"
								to="/application"
							>
								신청 내역 조회
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
			<PageContainer maxWidth="6xl">
				<PageHeader
					actions={
						<Button
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
					}
					description="등록된 수련회 신청 내역을 실시간으로 확인하세요."
					title="신청 내역 조회"
				/>

				{/* Stats Cards */}
				<StatGrid columns={3}>
					<StatCard
						description="현재까지 접수된 인원"
						icon={Users}
						title="총 신청자"
						unit="명"
						value={totalCount}
					/>
					<StatCard
						description="입금 확인된 인원"
						icon={CheckCircle2}
						iconColor="text-green-500"
						title="등록 완료"
						unit="명"
						value={paidCount}
					/>
					<StatCard
						description="입금 확인 중인 인원"
						icon={CreditCard}
						iconColor="text-orange-500"
						title="입금 대기"
						unit="명"
						value={pendingCount}
					/>
				</StatGrid>

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
						<ContentLoading message="데이터를 불러오는 중입니다..." />
					)}

					{!isLoadingFirstPage && data.length === 0 && (
						<EmptyState icon={Search} title="검색 결과가 없습니다" />
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
												<CardTitle className="text-base">{item.name}</CardTitle>
												<PaymentStatusBadge isPaid={item.isPaid} />
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
													<PaymentStatusBadge isPaid={item.isPaid} />
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
			</PageContainer>
		</PageLayout>
	);
}
