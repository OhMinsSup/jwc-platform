"use client";

import { FormInputField } from "~/components/common/FormInputField";

export function FormClubEmail() {
	return (
		<div className="space-y-6">
			<div className="space-y-3 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
					<svg
						className="h-6 w-6 text-green-600"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<title>이메일 아이콘</title>
						<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
					</svg>
				</div>
				<h2 className="font-bold text-2xl">이메일 주소를 입력해주세요</h2>
				<p className="text-muted-foreground">
					연락 가능한 이메일 주소를 입력해주세요. 신청 결과와 동아리 관련 안내를
					이메일로 보내드립니다.
				</p>
			</div>

			<div className="mx-auto max-w-md">
				<FormInputField
					name="email"
					label="이메일"
					inputProps={{
						type: "email",
						placeholder: "hong@example.com",
						autoComplete: "email",
						className: "text-center text-lg",
					}}
				/>
			</div>
		</div>
	);
}
