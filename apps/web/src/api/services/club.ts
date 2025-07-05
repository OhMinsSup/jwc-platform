import { log } from "@jwc/observability/log";
import type { ClubForm } from "@jwc/schema";
import type { Payload, TypeWithID } from "payload";
import type { Club } from "~/types/club";
// Constants
const CLUB_COLLECTION = "clubs" as const;
const CLUB_FORM_COLLECTION = "clubForms" as const;

const SUCCESS_MESSAGES = {
	CLUB_FOUND: "동아리 정보를 성공적으로 조회했습니다.",
	CLUB_FORM_CREATED: "동아리 신청서가 성공적으로 등록되었습니다.",
	CLUB_FORM_UPDATED: "동아리 신청서가 성공적으로 수정되었습니다.",
	CLUB_FORM_UPSERTED: "동아리 신청서가 성공적으로 처리되었습니다.",
} as const;

const ERROR_MESSAGES = {
	CLUB_NOT_FOUND: "동아리를 찾을 수 없습니다.",
	CLUBS_FIND_FAILED: "동아리 목록 조회에 실패했습니다.",
	CLUB_FORM_CREATE_FAILED: "동아리 신청서 등록에 실패했습니다.",
	CLUB_FORM_UPDATE_FAILED: "동아리 신청서 수정에 실패했습니다.",
	CLUB_FORM_UPSERT_FAILED: "동아리 신청서 처리에 실패했습니다.",
	CLUB_FORM_FIND_FAILED: "동아리 신청서 조회에 실패했습니다.",
	INVALID_CLUB_FORM_DATA: "잘못된 동아리 신청서 데이터입니다.",
} as const;

// Types
interface FindClubFormByUserOptions
	extends Pick<ClubForm, "clubId" | "name" | "phone"> {}

interface ServiceResponse<T = unknown> {
	success: boolean;
	data?: T;
	message: string;
	error?: string;
}

interface UpsertClubFormServiceResponse
	extends ServiceResponse<string | number> {
	isNew: boolean;
}

// Club type from Payload

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

/**
 * 모든 동아리 목록을 조회합니다.
 * @param payload - Payload 인스턴스
 * @returns 동아리 목록
 */
export async function getAllClubs(
	payload: Payload
): Promise<ServiceResponse<Club[]>> {
	try {
		const response = await payload.find({
			collection: CLUB_COLLECTION,
			sort: "-createdAt",
			limit: 100, // 적절한 제한
		});

		return createSuccessResponse(
			response.docs as Club[],
			SUCCESS_MESSAGES.CLUB_FOUND
		);
	} catch (error) {
		log.error("observability", error);
		return createErrorResponse(
			ERROR_MESSAGES.CLUBS_FIND_FAILED,
			error instanceof Error ? error.message : "Unknown error"
		);
	}
}

/**
 * ID로 특정 동아리를 조회합니다.
 * @param payload - Payload 인스턴스
 * @param id - 동아리 ID
 * @returns 동아리 정보
 */
export async function getClubById(
	payload: Payload,
	id: string | number
): Promise<ServiceResponse<Club>> {
	try {
		const club = await payload.findByID({
			collection: CLUB_COLLECTION,
			id,
		});

		if (!club) {
			return createErrorResponse(ERROR_MESSAGES.CLUB_NOT_FOUND);
		}

		return createSuccessResponse(club as Club, SUCCESS_MESSAGES.CLUB_FOUND);
	} catch (error) {
		log.error("observability", error);
		return createErrorResponse(
			ERROR_MESSAGES.CLUB_NOT_FOUND,
			error instanceof Error ? error.message : "Unknown error"
		);
	}
}

/**
 * 동아리 신청서를 등록합니다.
 * @param payload - Payload 인스턴스
 * @param data - 등록할 동아리 신청서 데이터
 * @returns 생성된 동아리 신청서 정보
 */
export async function createClubForm(
	payload: Payload,
	data: ClubForm
): Promise<ServiceResponse<TypeWithID & ClubForm>> {
	try {
		// 1. ClubForm 생성 (club 관계 포함)
		const created = await payload.create({
			collection: CLUB_FORM_COLLECTION,
			data: {
				...data,
				club: data.clubId, // club 관계 설정
			},
		});

		// 2. Club에 이 ClubForm 추가
		try {
			const club = await payload.findByID({
				collection: CLUB_COLLECTION,
				id: data.clubId,
			});

			if (club) {
				const existingClubForms = Array.isArray(club.clubForms)
					? club.clubForms
					: [];

				// 이미 존재하는지 확인
				const isAlreadyConnected = existingClubForms.some(
					(formId: string | number) =>
						formId.toString() === created.id.toString()
				);

				if (!isAlreadyConnected) {
					await payload.update({
						collection: CLUB_COLLECTION,
						id: data.clubId,
						data: {
							clubForms: [...existingClubForms, created.id],
						},
					});
				}
			}
		} catch (clubUpdateError) {
			// Club 업데이트 실패는 로그만 남기고 계속 진행
			log.error("observability", clubUpdateError);
		}

		return createSuccessResponse(
			created as TypeWithID & ClubForm,
			SUCCESS_MESSAGES.CLUB_FORM_CREATED
		);
	} catch (error) {
		log.error("observability", error);
		return createErrorResponse(
			ERROR_MESSAGES.CLUB_FORM_CREATE_FAILED,
			error instanceof Error ? error.message : "Unknown error"
		);
	}
}

/**
 * 동아리 신청서를 수정합니다.
 * @param payload - Payload 인스턴스
 * @param id - 수정할 동아리 신청서 ID
 * @param data - 수정할 동아리 신청서 데이터
 * @returns 수정된 동아리 신청서 정보
 */
export async function updateClubForm(
	payload: Payload,
	id: string | number,
	data: ClubForm
): Promise<ServiceResponse<TypeWithID & ClubForm>> {
	try {
		const updated = await payload.update({
			collection: CLUB_FORM_COLLECTION,
			id,
			data: {
				...data,
				club: data.clubId, // club 관계 유지
			},
		});

		return createSuccessResponse(
			updated as TypeWithID & ClubForm,
			SUCCESS_MESSAGES.CLUB_FORM_UPDATED
		);
	} catch (error) {
		log.error("observability", error);
		return createErrorResponse(
			ERROR_MESSAGES.CLUB_FORM_UPDATE_FAILED,
			error instanceof Error ? error.message : "Unknown error"
		);
	}
}

/**
 * 사용자 정보를 기반으로 기존 동아리 신청서를 찾습니다.
 * @param payload - Payload 인스턴스
 * @param options - 검색 조건
 * @returns 찾은 동아리 신청서 정보 또는 undefined
 */
export async function findClubFormByUser(
	payload: Payload,
	options: FindClubFormByUserOptions
): Promise<ServiceResponse<(TypeWithID & ClubForm) | undefined>> {
	try {
		const { clubId, name, phone } = options;

		const response = await payload.find({
			collection: CLUB_FORM_COLLECTION,
			where: {
				and: [
					{ club: { equals: clubId } },
					{ name: { equals: name } },
					{ phone: { equals: phone } },
				],
			},
			sort: "-createdAt",
			limit: 5, // 성능을 위해 제한
		});

		const existingForm =
			response.docs.length > 0
				? (response.docs[0] as TypeWithID & ClubForm)
				: undefined;

		return createSuccessResponse(
			existingForm,
			existingForm
				? "기존 동아리 신청서를 찾았습니다."
				: "기존 동아리 신청서가 없습니다."
		);
	} catch (error) {
		log.error("observability", error);
		return createErrorResponse(
			ERROR_MESSAGES.CLUB_FORM_FIND_FAILED,
			error instanceof Error ? error.message : "Unknown error"
		);
	}
}

/**
 * 동아리 신청서를 생성하거나 업데이트합니다 (Upsert).
 * 기존 신청서가 있으면 업데이트하고, 없으면 새로 생성합니다.
 * @param payload - Payload 인스턴스
 * @param data - 동아리 신청서 데이터
 * @returns Upsert 결과
 */
export async function upsertClubForm(
	payload: Payload,
	data: ClubForm
): Promise<UpsertClubFormServiceResponse> {
	try {
		// 기존 신청서 찾기
		const findResult = await findClubFormByUser(payload, {
			clubId: data.clubId,
			name: data.name,
			phone: data.phone,
		});

		if (!findResult.success) {
			return {
				...findResult,
				isNew: false,
			} as UpsertClubFormServiceResponse;
		}

		const existingForm = findResult.data;

		if (existingForm) {
			// 기존 신청서가 있으면 업데이트
			const updateResult = await updateClubForm(payload, existingForm.id, data);
			return {
				...updateResult,
				isNew: false,
			} as UpsertClubFormServiceResponse;
		}

		// 기존 신청서가 없으면 새로 생성
		const createResult = await createClubForm(payload, data);
		return {
			...createResult,
			data: createResult.data?.id,
			isNew: true,
		} as UpsertClubFormServiceResponse;
	} catch (error) {
		log.error("observability", error);
		return {
			success: false,
			message: ERROR_MESSAGES.CLUB_FORM_UPSERT_FAILED,
			error: error instanceof Error ? error.message : "Unknown error",
			isNew: false,
		};
	}
}

/**
 * 특정 동아리의 모든 신청서를 조회합니다.
 * @param payload - Payload 인스턴스
 * @param clubId - 동아리 ID
 * @returns 동아리 신청서 목록
 */
export async function getClubFormsByClubId(
	payload: Payload,
	clubId: string | number
): Promise<ServiceResponse<(TypeWithID & ClubForm)[]>> {
	try {
		const response = await payload.find({
			collection: CLUB_FORM_COLLECTION,
			where: {
				id: { equals: clubId },
			},
			sort: "-createdAt",
			limit: 1000, // 적절한 제한
		});

		return createSuccessResponse(
			response.docs as (TypeWithID & ClubForm)[],
			`동아리 신청서 ${response.docs.length}건을 조회했습니다.`
		);
	} catch (error) {
		log.error("observability", error);
		return createErrorResponse(
			ERROR_MESSAGES.CLUB_FORM_FIND_FAILED,
			error instanceof Error ? error.message : "Unknown error"
		);
	}
}
