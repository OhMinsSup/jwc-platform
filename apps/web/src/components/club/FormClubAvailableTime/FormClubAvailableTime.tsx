"use client";

import { FormTextareaField } from "~/components/common/FormTextareaField";

export function FormClubAvailableTime() {
	return (
		<div className="space-y-6">
			<div className="space-y-3 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
					<svg
						className="h-6 w-6 text-indigo-600"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<title>시계 아이콘</title>
						<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
					</svg>
				</div>
				<h2 className="font-bold text-2xl">참여 가능 시간을 알려주세요</h2>
				<p className="text-muted-foreground">
					동아리 활동에 참여 가능한 시간대를 구체적으로 작성해주세요.
					<br />
					이를 통해 함께 활동할 수 있는 최적의 시간을 찾을 수 있어요.
				</p>
			</div>

			<div className="mx-auto max-w-2xl">
				<FormTextareaField
					name="availableTime"
					label="참여 가능 시간"
					textareaProps={{
						placeholder:
							"예시: \n• 주일: 오후 2시~6시 가능\n• 평일: 월, 수, 금 저녁 7시~9시\n• 토요일: 오전 10시~12시\n• 특별 연습: 주말 오후 시간 조정 가능",
						rows: 5,
						className: "text-base leading-relaxed",
					}}
				/>
				<div className="mt-3 rounded-lg bg-blue-50 p-4">
					<p className="text-blue-800 text-sm">
						<strong>📅 참고사항:</strong>
						<br />• 정기 모임: 대부분 주일 오후나 평일 저녁에 진행됩니다
						<br />• 특별 행사: 월 1-2회 추가 연습이나 봉사가 있을 수 있습니다
						<br />• 유연한 참여: 100% 참석이 어려워도 괜찮으니 솔직하게
						작성해주세요
					</p>
				</div>
			</div>
		</div>
	);
}
