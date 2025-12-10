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
	cn,
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
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	CheckCircle,
	Clock,
	Eye,
	Loader2,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/application/")({
	component: ApplicationListPage,
});

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.05, delayChildren: 0.1 },
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 10 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.3, ease: "easeOut" },
	},
};

interface OnboardingListItem {
	_id: Id<"onboarding">;
	_creationTime: number;
	name: string;
	maskedPhone: string;
	gender: "male" | "female";
	department: "youth1" | "youth2" | "other";
	ageGroup: string;
	stayType: "3nights4days" | "2nights3days" | "1night2days" | "dayTrip";
	isPaid: boolean;
	tfTeam?: "none" | "praise" | "program" | "media";
	tshirtSize?: "s" | "m" | "l" | "xl" | "2xl" | "3xl";
}

function ApplicationListPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [department, setDepartment] = useState<Department | "all">("all");
	const [isLoading, setIsLoading] = useState(true);
	const [data, setData] = useState<OnboardingListItem[]>([]);

	const searchOnboardings = useAction(api.onboardingActions.searchOnboardings);

	// 디바운스 처리
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(searchQuery);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// 검색 실행
	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await searchOnboardings({
				searchQuery: debouncedQuery || undefined,
				department: department === "all" ? undefined : department,
			});
			setData(result);
		} catch (error) {
			console.error("Failed to fetch applications:", error);
		} finally {
			setIsLoading(false);
		}
	}, [searchOnboardings, debouncedQuery, department]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				<motion.div
					animate="visible"
					className="space-y-6"
					initial="hidden"
					variants={containerVariants}
				>
					{/* 헤더 */}
					<motion.div variants={itemVariants}>
						<div className="mb-2 flex items-center gap-4">
							<Button asChild size="icon" variant="ghost">
								<Link to="/">
									<ArrowLeft className="h-5 w-5" />
								</Link>
							</Button>
							<h1 className="font-bold text-2xl sm:text-3xl">신청 내역</h1>
						</div>
						<p className="ml-12 text-muted-foreground">
							수련회 신청 내역을 조회합니다.
						</p>
					</motion.div>

					{/* 검색 필터 */}
					<motion.div
						className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
						variants={itemVariants}
					>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
							<div className="relative flex-1">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									className="pl-10"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="이름 또는 전화번호로 검색..."
									value={searchQuery}
								/>
							</div>
							<Select
								onValueChange={(value) =>
									setDepartment(value as Department | "all")
								}
								value={department}
							>
								<SelectTrigger className="w-full sm:w-[180px]">
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
					</motion.div>

					{/* 통계 */}
					<motion.div variants={itemVariants}>
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
							<StatCard
								icon={<Users className="h-5 w-5" />}
								isLoading={isLoading}
								label="전체 신청"
								value={data.length}
							/>
							<StatCard
								icon={<CheckCircle className="h-5 w-5 text-green-500" />}
								isLoading={isLoading}
								label="납부 완료"
								value={data.filter((d) => d.isPaid).length}
							/>
							<StatCard
								icon={<Clock className="h-5 w-5 text-amber-500" />}
								isLoading={isLoading}
								label="납부 대기"
								value={data.filter((d) => !d.isPaid).length}
							/>
							<StatCard
								icon={<Users className="h-5 w-5 text-blue-500" />}
								isLoading={isLoading}
								label="청년1부"
								value={data.filter((d) => d.department === "youth1").length}
							/>
						</div>
					</motion.div>

					{/* 테이블 */}
					<motion.div
						className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm"
						variants={itemVariants}
					>
						<ApplicationTable
							data={data}
							department={department}
							isLoading={isLoading}
							searchQuery={searchQuery}
						/>
					</motion.div>
				</motion.div>
			</div>
		</div>
	);
}

interface ApplicationTableProps {
	data: OnboardingListItem[];
	isLoading: boolean;
	searchQuery: string;
	department: Department | "all";
}

function ApplicationTable({
	data,
	isLoading,
	searchQuery,
	department,
}: ApplicationTableProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<XCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
				<p className="text-muted-foreground">
					{searchQuery || department !== "all"
						? "검색 결과가 없습니다."
						: "신청 내역이 없습니다."}
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[100px]">이름</TableHead>
						<TableHead className="w-[140px]">전화번호</TableHead>
						<TableHead className="w-[100px]">부서</TableHead>
						<TableHead className="w-[110px]">또래</TableHead>
						<TableHead className="w-[110px]">참석유형</TableHead>
						<TableHead className="w-[100px]">납부상태</TableHead>
						<TableHead className="w-[120px]">신청일</TableHead>
						<TableHead className="w-[120px]">상세</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((item) => (
						<TableRow key={item._id}>
							<TableCell className="font-medium">{item.name}</TableCell>
							<TableCell className="text-muted-foreground">
								{item.maskedPhone}
							</TableCell>
							<TableCell>
								<Badge
									className={cn(
										item.department === "youth1" &&
											"bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
										item.department === "youth2" &&
											"bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
									)}
									variant="secondary"
								>
									{DEPARTMENT_LABELS[item.department]}
								</Badge>
							</TableCell>
							<TableCell>{item.ageGroup}</TableCell>
							<TableCell>
								<Badge variant="outline">
									{STAY_TYPE_LABELS[item.stayType]}
								</Badge>
							</TableCell>
							<TableCell>
								{item.isPaid ? (
									<Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
										납부완료
									</Badge>
								) : (
									<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
										대기중
									</Badge>
								)}
							</TableCell>
							<TableCell className="text-muted-foreground text-sm">
								{format(new Date(item._creationTime), "yy.MM.dd", {
									locale: ko,
								})}
							</TableCell>
							<TableCell>
								<Button asChild size="sm" variant="ghost">
									<Link params={{ id: item._id }} to="/application/$id">
										<Eye className="h-4 w-4" />
									</Link>
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

interface StatCardProps {
	icon: React.ReactNode;
	label: string;
	value: number;
	isLoading: boolean;
}

function StatCard({ icon, label, value, isLoading }: StatCardProps) {
	return (
		<div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
					{icon}
				</div>
				<div>
					<p className="text-muted-foreground text-sm">{label}</p>
					<p className="font-bold text-xl">
						{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : value}
					</p>
				</div>
			</div>
		</div>
	);
}
