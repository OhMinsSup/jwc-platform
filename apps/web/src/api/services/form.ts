import type { Form } from "@jwc/schema";
import type { Payload, TypeWithID } from "payload";

// Constants
const FORM_COLLECTION = "forms" as const;

const SUCCESS_MESSAGES = {
	FORM_CREATED: "신청서가 성공적으로 등록되었습니다.",
	FORM_UPDATED: "신청서가 성공적으로 수정되었습니다.",
	FORM_UPSERTED: "신청서가 성공적으로 처리되었습니다.",
} as const;

const ERROR_MESSAGES = {
	FORM_CREATE_FAILED: "신청서 등록에 실패했습니다.",
	FORM_UPDATE_FAILED: "신청서 수정에 실패했습니다.",
	FORM_UPSERT_FAILED: "신청서 처리에 실패했습니다.",
	FORM_FIND_FAILED: "신청서 조회에 실패했습니다.",
	INVALID_FORM_DATA: "잘못된 신청서 데이터입니다.",
} as const;

// Types
interface FindFormByUserOptions
	extends Pick<Form, "name" | "phone" | "ageGroup" | "gender" | "department"> {}

interface ServiceResponse<T = unknown> {
	success: boolean;
	data?: T;
	message: string;
	error?: string;
}

interface UpsertFormServiceResponse extends ServiceResponse<string | number> {
	isNew: boolean;
}

// Utility functions
const createSuccessResponse = <T>(
	data: T,
	message: string
): ServiceResponse<T> => ({
	success: true,
	data,
	message,
});

const createErrorResponse = <T = never>(
	message: string,
	error?: string
): ServiceResponse<T> => ({
	success: false,
	message,
	error,
});

const sanitizeCarSupportData = (data: Form): Form => {
	// 차량 지원 내용이 있으면 차량 지원을 true로 설정
	const hasCarSupportContent = Boolean(
		data.carSupportContent && data.carSupportContent.trim().length > 0
	);

	if (hasCarSupportContent && !data.carSupport) {
		return {
			...data,
			carSupport: true,
		};
	}

	return data;
};

/**
 * 폼 정보를 등록합니다.
 * @param payload - Payload 인스턴스
 * @param data - 등록할 폼의 데이터
 * @returns 생성된 폼 정보
 */
export async function createForm(
	payload: Payload,
	data: Form
): Promise<TypeWithID & Form> {
	try {
		const sanitizedData = sanitizeCarSupportData(data);
		const created = await payload.create({
			collection: FORM_COLLECTION,
			data: sanitizedData,
		});
		return created as TypeWithID & Form;
	} catch (error) {
		payload.logger.error("Failed to create form:", error);
		throw new Error(ERROR_MESSAGES.FORM_CREATE_FAILED);
	}
}

/**
 * 폼 정보를 수정합니다.
 * @param payload - Payload 인스턴스
 * @param id - 수정할 폼의 ID
 * @param data - 수정할 폼의 데이터
 * @returns 수정된 폼 정보
 */
export async function updateForm(
	payload: Payload,
	id: string | number,
	data: Form
): Promise<TypeWithID & Form> {
	try {
		const sanitizedData = sanitizeCarSupportData(data);
		const updated = await payload.update({
			collection: FORM_COLLECTION,
			id,
			data: sanitizedData,
		});
		return updated as TypeWithID & Form;
	} catch (error) {
		payload.logger.error(`Failed to update form with id ${id}:`, error);
		throw new Error(ERROR_MESSAGES.FORM_UPDATE_FAILED);
	}
}

/**
 * 사용자 정보를 기반으로 기존 폼을 찾습니다.
 * @param payload - Payload 인스턴스
 * @param options - 검색 조건
 * @returns 찾은 폼 정보 또는 undefined
 */
export async function findFormByUser(
	payload: Payload,
	options: FindFormByUserOptions
): Promise<(TypeWithID & Form) | undefined> {
	try {
		const { phone, name, gender, ageGroup } = options;

		// 성능 최적화: 필요한 필드만 선택
		const response = await payload.find({
			collection: FORM_COLLECTION,
			where: {
				and: [
					{ name: { equals: name } },
					{ gender: { equals: gender } },
					{ ageGroup: { equals: ageGroup } },
					{ phone: { equals: phone } },
				],
			},
			sort: "-createdAt",
			limit: 5, // 성능을 위해 제한
		});

		if (response.docs.length === 0) {
			return undefined;
		}

		if (response.docs.length > 1) {
			payload.logger.warn(
				`Multiple forms found for user ${name} (${phone}). Returning the most recent one.`
			);
		}

		return response.docs[0] as TypeWithID & Form;
	} catch (error) {
		payload.logger.error("Failed to find form by user:", error);
		throw new Error(ERROR_MESSAGES.FORM_FIND_FAILED);
	}
}

/**
 * 폼 정보를 등록합니다 (서비스 레이어).
 * @param payload - Payload 인스턴스
 * @param data - 등록할 폼의 데이터
 * @returns 표준화된 서비스 응답
 */
export async function createFormService(
	payload: Payload,
	data: Form
): Promise<ServiceResponse<TypeWithID & Form>> {
	try {
		const response = await createForm(payload, data);
		return createSuccessResponse(response, SUCCESS_MESSAGES.FORM_CREATED);
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: ERROR_MESSAGES.FORM_CREATE_FAILED;
		return createErrorResponse<TypeWithID & Form>(errorMessage, String(error));
	}
}

/**
 * 폼 정보를 수정합니다 (서비스 레이어).
 * @param payload - Payload 인스턴스
 * @param id - 수정할 폼의 ID
 * @param data - 수정할 폼의 데이터
 * @returns 표준화된 서비스 응답
 */
export async function updateFormService(
	payload: Payload,
	id: string | number,
	data: Form
): Promise<ServiceResponse<TypeWithID & Form>> {
	try {
		const response = await updateForm(payload, id, data);
		return createSuccessResponse(response, SUCCESS_MESSAGES.FORM_UPDATED);
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: ERROR_MESSAGES.FORM_UPDATE_FAILED;
		return createErrorResponse<TypeWithID & Form>(errorMessage, String(error));
	}
}

/**
 * 폼 정보를 등록 또는 수정합니다.
 * @param payload - Payload 인스턴스
 * @param data - 등록할 폼의 데이터
 * @returns 표준화된 upsert 서비스 응답
 */
export async function upsertFormService(
	payload: Payload,
	data: Form
): Promise<UpsertFormServiceResponse> {
	try {
		const existingForm = await findFormByUser(payload, data);

		const result = existingForm
			? await updateFormService(payload, existingForm.id, data)
			: await createFormService(payload, data);

		if (!result.success || !result.data) {
			return {
				success: false,
				message: result.message,
				error: result.error,
				isNew: false,
			};
		}

		return {
			success: true,
			data: result.data.id,
			message: SUCCESS_MESSAGES.FORM_UPSERTED,
			isNew: !existingForm,
		};
	} catch (error) {
		payload.logger.error("Failed to upsert form:", error);
		const errorMessage =
			error instanceof Error
				? error.message
				: ERROR_MESSAGES.FORM_UPSERT_FAILED;
		return {
			success: false,
			message: errorMessage,
			error: String(error),
			isNew: false,
		};
	}
}
