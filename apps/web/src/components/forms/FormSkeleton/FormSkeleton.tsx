import { Skeleton } from "@jwc/ui";
import React from "react";

export default function FormSkeleton() {
	return (
		<form className="flex flex-col gap-6">
			{/* 제목 및 설명 */}
			<div className="flex flex-row items-center space-x-4">
				<Skeleton className="h-4 w-8" /> {/* Step 번호 */}
				<Skeleton className="h-8 w-48" /> {/* 제목 */}
			</div>

			{/* 입력 필드 */}
			<div className="flex flex-col gap-4">
				<Skeleton className="h-8 w-full" /> {/* 입력 필드 1 */}
			</div>

			{/* 버튼 */}
			<div className="flex flex-row items-center space-x-4">
				<Skeleton className="h-10 w-24" /> {/* 확인 버튼 */}
				<Skeleton className="h-10 w-24" /> {/* 취소 버튼 */}
			</div>
		</form>
	);
}
