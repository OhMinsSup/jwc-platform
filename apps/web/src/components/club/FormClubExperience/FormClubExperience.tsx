"use client";

import { FormTextareaField } from "~/components/common/FormTextareaField";

export function FormClubExperience() {
	return (
		<div className="space-y-6">
			<div className="space-y-3 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
					<svg
						className="h-6 w-6 text-yellow-600"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<title>별 아이콘</title>
						<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
					</svg>
				</div>
				<h2 className="font-bold text-2xl">관련 경험이 있으신가요?</h2>
				<p className="text-muted-foreground">
					해당 분야의 관련 경험이나 특기사항이 있다면 작성해주세요.
					<br />
					<span className="text-sm">
						(선택사항이며, 없어도 지원에 문제가 없습니다)
					</span>
				</p>
			</div>

			<div className="mx-auto max-w-2xl">
				<FormTextareaField
					name="experience"
					label="관련 경험 (선택사항)"
					textareaProps={{
						placeholder:
							"예시: 고등학교 시절 밴드에서 베이스 연주 경험이 있습니다. 대학교 찬양팀에서 2년간 활동했고, 악기 연주뿐만 아니라 사운드 믹싱에도 관심이 많습니다...",
						rows: 5,
						className: "text-base leading-relaxed",
					}}
				/>
				<p className="mt-2 text-muted-foreground text-sm">
					✨ 관련 경험이 없어도 괜찮습니다. 열정과 배우려는 마음이 더 중요해요!
				</p>
			</div>
		</div>
	);
}
