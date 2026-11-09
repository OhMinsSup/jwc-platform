import { SubmissionStoreError } from "@jwc/submission-store";

import { NotFoundError } from "../../../platform/server/errors/not-found-error";
import { log } from "../../../platform/server/log";
import { submissionStore } from "../../../platform/server/runtime";
import {
	publishedFormById,
	storeTargetOf,
} from "../../forms/server/definitions";
import { findKey, isStoredKey } from "./submission-keys-repository";

/** 관리자 화면에서 납입 상태 변경 → 저장소(원본)의 납입 여부를 바로 바꾼다 */
export async function markPaid(
	submissionId: string,
	paid: boolean,
): Promise<void> {
	const key = await findKey(submissionId);
	if (!isStoredKey(key)) {
		throw new NotFoundError("응답을 찾을 수 없습니다");
	}
	const { form, definition } = await publishedFormById(key.formId);
	try {
		await submissionStore().setPaid(
			storeTargetOf(form, definition),
			submissionId,
			paid,
		);
	} catch (error) {
		if (
			error instanceof SubmissionStoreError &&
			error.failure === "not_found"
		) {
			throw new NotFoundError(
				"시트에서 응답 행을 찾을 수 없습니다 (행이 삭제되었을 수 있습니다)",
				{ cause: error },
			);
		}
		throw error;
	}
	log.info("submission.paid_changed", { submissionId, paid });
}
