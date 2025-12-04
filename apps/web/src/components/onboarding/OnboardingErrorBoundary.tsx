import { Button } from "@jwc/ui";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertCircle, Home, RefreshCw, RotateCcw } from "lucide-react";

export function OnboardingErrorBoundary({ error, reset }: ErrorComponentProps) {
	const router = useRouter();

	const handleRetry = () => {
		reset();
	};

	const handleRestart = () => {
		router.navigate({ to: "/onboarding/$step", params: { step: "welcome" } });
	};

	// 에러 메시지 추출
	const errorMessage =
		error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

	console.error("[Onboarding Error]", error);

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className="flex min-h-[400px] flex-col items-center justify-center px-4 py-12 text-center"
			initial={{ opacity: 0, y: 20 }}
			transition={{ duration: 0.3 }}
		>
			{/* 에러 아이콘 */}
			<motion.div
				animate={{ scale: 1 }}
				className="mb-6"
				initial={{ scale: 0 }}
				transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
			>
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
					<AlertCircle className="h-10 w-10 text-red-500" />
				</div>
			</motion.div>

			{/* 에러 메시지 */}
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				initial={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.2 }}
			>
				<h2 className="mb-2 font-bold text-2xl">문제가 발생했습니다</h2>
				<p className="mb-6 max-w-md text-muted-foreground">
					신청 과정에서 오류가 발생했습니다. 다시 시도하거나 처음부터 시작해
					주세요.
				</p>
			</motion.div>

			{/* 에러 상세 (개발 환경에서만 표시) */}
			{import.meta.env.DEV && (
				<motion.div
					animate={{ opacity: 1 }}
					className="mb-6 w-full max-w-md"
					initial={{ opacity: 0 }}
					transition={{ delay: 0.3 }}
				>
					<details className="rounded-lg border border-red-200 bg-red-50 p-4 text-left dark:border-red-900 dark:bg-red-950">
						<summary className="cursor-pointer font-medium text-red-800 text-sm dark:text-red-200">
							오류 상세 정보 (개발용)
						</summary>
						<pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-red-700 text-xs dark:text-red-300">
							{errorMessage}
						</pre>
					</details>
				</motion.div>
			)}

			{/* 액션 버튼들 */}
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col gap-3 sm:flex-row"
				initial={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.4 }}
			>
				<Button className="gap-2" onClick={handleRetry} variant="default">
					<RefreshCw className="h-4 w-4" />
					다시 시도
				</Button>
				<Button className="gap-2" onClick={handleRestart} variant="outline">
					<RotateCcw className="h-4 w-4" />
					처음부터 시작
				</Button>
				<Link to="/">
					<Button className="w-full gap-2" variant="ghost">
						<Home className="h-4 w-4" />
						홈으로
					</Button>
				</Link>
			</motion.div>
		</motion.div>
	);
}

export default OnboardingErrorBoundary;
