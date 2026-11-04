import { contactPhone, identityKey, interpretCellEdit } from "@jwc/form-core";
import type { AnswerValue, CellEdit, FormDefinition } from "@jwc/form-core";
import { z } from "zod";

import { encryptText, hmacHex } from "../crypto";
import { ConflictError, InvalidInputError } from "../errors";
import { findFormBySheetName } from "../repositories/forms";
import {
	findSubmission,
	setPaid,
	updateIdentity,
} from "../repositories/submissions";
import { dataKeys, spreadsheetId } from "../runtime";
import { publishedFormById } from "./definitions";

/** Apps Script가 보내는 셀 수정 이벤트 (서명 검증 후 이 스키마로 경계 검증) */
export const SheetEditSchema = z.object({
	spreadsheetId: z.string().min(1).max(200),
	sheetName: z.string().min(1).max(200),
	header: z.string().max(200),
	id: z.string().max(100),
	value: z.string().max(5000),
});
export type SheetEdit = z.infer<typeof SheetEditSchema>;

export type EditResult =
	| { applied: true; effect: string }
	| { applied: false; reason: string };

interface EditTarget {
	definition: FormDefinition;
	formId: string;
	submissionId: string;
}

async function findEditTarget(edit: SheetEdit): Promise<EditTarget | null> {
	if (edit.spreadsheetId !== spreadsheetId()) {
		return null;
	}
	const form = await findFormBySheetName(edit.sheetName);
	const submission = edit.id ? await findSubmission(edit.id) : undefined;
	if (!(form && submission) || submission.formId !== form.id) {
		return null;
	}
	const { definition } = await publishedFormById(form.id);
	return { formId: form.id, submissionId: submission.id, definition };
}

const UNIQUE_VIOLATION = "UNIQUE constraint failed";

/** 같은 식별값을 가진 다른 응답이 있으면(유니크 위반) 사용자에게 보일 충돌 오류로 바꾼다 */
async function updateIdentityOrConflict(
	submissionId: string,
	patch: Parameters<typeof updateIdentity>[1],
	header: string,
): Promise<void> {
	try {
		await updateIdentity(submissionId, patch);
	} catch (error) {
		if (error instanceof Error && error.message.includes(UNIQUE_VIOLATION)) {
			throw new ConflictError(
				`${header}: 같은 값으로 제출된 다른 응답이 있습니다`,
				{ cause: error },
			);
		}
		throw error;
	}
}

/** 식별/연락처 필드가 바뀌면 D1의 해시/암호문을 다시 계산한다 */
async function applyIdentityChange(
	target: EditTarget,
	header: string,
	fieldId: string,
	value: AnswerValue,
): Promise<EditResult> {
	const { definition } = target;
	const isIdentity = fieldId === definition.identity.fieldId;
	const isContact = fieldId === definition.contact?.phoneFieldId;
	if (!(isIdentity || isContact)) {
		return { applied: true, effect: "시트 원본 갱신 (D1 변경 없음)" };
	}
	const answers = { [fieldId]: value };
	const keys = await dataKeys();
	const identity = isIdentity ? identityKey(definition, answers) : null;
	const phone = isContact ? contactPhone(definition, answers) : null;
	await updateIdentityOrConflict(
		target.submissionId,
		{
			identityHash: identity
				? await hmacHex(keys.identity, `${target.formId}:${identity}`)
				: undefined,
			contactCipher: phone
				? await encryptText(keys.encryption, phone)
				: undefined,
		},
		header,
	);
	return { applied: true, effect: "식별/연락처 갱신" };
}

/**
 * 시트 셀 수정 반영.
 * 답변 원본은 시트이므로 일반 필드 수정은 D1에 아무것도 쓰지 않는다.
 * D1이 알아야 하는 것(납입여부, 식별/연락처 필드)만 반영한다.
 */
export async function applySheetEdit(
	edit: SheetEdit,
	now: number,
): Promise<EditResult> {
	const target = await findEditTarget(edit);
	if (!target) {
		return { applied: false, reason: "응답을 찾을 수 없음" };
	}
	const change = interpretCellEdit(target.definition, edit.header, edit.value);
	switch (change.kind) {
		case "paid": {
			await setPaid(target.submissionId, change.paid, now);
			return { applied: true, effect: change.paid ? "납입 처리" : "미납 처리" };
		}
		case "invalid": {
			throw new InvalidInputError(`${change.header}: ${change.message}`);
		}
		case "readonly":
		case "unknown": {
			return { applied: false, reason: `${change.kind}: ${change.header}` };
		}
		case "field": {
			return await applyFieldEdit(target, edit.header, change);
		}
		default: {
			// 타입상 도달하지 않는다 (CellEdit의 모든 종류를 위에서 처리)
			throw new Error("처리하지 않은 셀 수정 종류입니다");
		}
	}
}

/** 질문 셀 수정: 식별/연락처는 비울 수 없고, 값이 있으면 D1 해시/암호문을 갱신한다 */
async function applyFieldEdit(
	target: EditTarget,
	header: string,
	change: Extract<CellEdit, { kind: "field" }>,
): Promise<EditResult> {
	if (
		change.value === null &&
		isProtectedField(target.definition, change.fieldId)
	) {
		throw new InvalidInputError(
			`${header}: 식별/연락처 항목은 비울 수 없습니다`,
		);
	}
	return change.value === null
		? { applied: true, effect: "시트 원본 갱신 (D1 변경 없음)" }
		: await applyIdentityChange(target, header, change.fieldId, change.value);
}

function isProtectedField(
	definition: FormDefinition,
	fieldId: string,
): boolean {
	return (
		fieldId === definition.identity.fieldId ||
		fieldId === definition.contact?.phoneFieldId
	);
}
