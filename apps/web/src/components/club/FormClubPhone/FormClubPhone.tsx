"use client";

import { FormInputField } from "~/components/common/FormInputField";

export function FormClubPhone() {
	return (
		<div className="space-y-6">
			<div className="space-y-3 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
					<svg
						className="h-6 w-6 text-purple-600"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<title>전화 아이콘</title>
						<path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
					</svg>
				</div>
				<h2 className="font-bold text-2xl">연락처를 입력해주세요</h2>
				<p className="text-muted-foreground">
					연락 가능한 휴대폰 번호를 입력해주세요. 긴급한 공지사항이나 중요한
					안내를 문자로 보내드립니다.
				</p>
			</div>

			<div className="mx-auto max-w-md">
				<FormInputField
					name="phone"
					label="연락처"
					inputProps={{
						type: "tel",
						placeholder: "010-1234-5678",
						autoComplete: "tel",
						className: "text-center text-lg",
					}}
				/>
			</div>
		</div>
	);
}
