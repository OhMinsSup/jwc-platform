"use client";

import { FormInputField } from "~/components/common/FormInputField";

export function FormClubName() {
	return (
		<div className="space-y-6">
			<div className="space-y-3 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
					<svg
						className="h-6 w-6 text-blue-600"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<title>사용자 아이콘</title>
						<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
					</svg>
				</div>
				<h2 className="font-bold text-2xl">이름을 입력해주세요</h2>
				<p className="text-muted-foreground">
					신청자의 성함을 정확히 입력해주세요. 입력하신 이름으로 연락을 드릴
					예정입니다.
				</p>
			</div>

			<div className="mx-auto max-w-md">
				<FormInputField
					name="name"
					label="이름"
					inputProps={{
						placeholder: "홍길동",
						autoComplete: "name",
						className: "text-center text-lg",
					}}
				/>
			</div>
		</div>
	);
}
