import { onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { upsertClubForm } from "~/api/actions/clubForms";
import { ERROR_MESSAGES } from "../constants";
import type { ClubFormData } from "../types";

/**
 * 폼 제출 로직을 관리하는 훅
 */
export const useClubFormSubmission = (clubId: string | number) => {
	const router = useRouter();

	// 서버 액션 설정
	const { execute, status } = useServerAction(upsertClubForm, {
		interceptors: [
			onSuccess((ctx) => {
				if (ctx.success) {
					router.push(`/form/club/${clubId}/success`);
				}
			}),
		],
	});

	// 폼 제출 핸들러
	const onSubmit = useCallback(
		async (data: ClubFormData) => {
			try {
				const clubFormData = {
					clubId:
						typeof clubId === "string" ? Number.parseInt(clubId, 10) : clubId,
					name: data.name,
					phone: data.phone,
					department: data.department,
					ageGroup: data.ageGroup,
					data: data.data,
				};

				// 서버 액션 실행
				await execute(clubFormData);
			} catch (error) {
				console.error("동아리 신청 제출 실패:", error);
				const errorMessage =
					error instanceof Error ? error.message : ERROR_MESSAGES.submit;
				alert(errorMessage);
			}
		},
		[clubId, execute]
	);

	// 뒤로가기 핸들러
	const handleGoBack = useCallback(() => {
		router.back();
	}, [router]);

	return {
		onSubmit,
		handleGoBack,
		isSubmitting: status === "pending",
	};
};
