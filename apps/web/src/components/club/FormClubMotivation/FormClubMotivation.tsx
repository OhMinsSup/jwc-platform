"use client";

import { FormTextareaField } from "~/components/common/FormTextareaField";

export function FormClubMotivation() {
	return (
		<div className="space-y-6">
			<div className="space-y-3 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
					<svg
						className="h-6 w-6 text-red-600"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<title>하트 아이콘</title>
						<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
					</svg>
				</div>
				<h2 className="font-bold text-2xl">지원 동기를 작성해주세요</h2>
				<p className="text-muted-foreground">
					해당 동아리에 지원하게 된 동기와 열정을 진솔하게 작성해주세요.
					<br />
					어떤 활동을 기대하시는지, 어떻게 기여하고 싶으신지 알려주세요.
				</p>
			</div>

			<div className="mx-auto max-w-2xl">
				<FormTextareaField
					name="motivation"
					label="지원 동기"
					textareaProps={{
						placeholder:
							"예시: 찬양 사역을 통해 하나님께 영광을 돌리고 싶습니다. 어렸을 때부터 음악을 좋아했고, 대학교에서 성악을 전공했습니다. 교회 공동체와 함께 찬양하며 은혜를 나누고 싶어 지원하게 되었습니다...",
						rows: 6,
						className: "text-base leading-relaxed",
					}}
				/>
				<p className="mt-2 text-muted-foreground text-sm">
					💡 팁: 구체적인 경험이나 목표를 포함하면 더 좋은 인상을 줄 수 있어요!
				</p>
			</div>
		</div>
	);
}
