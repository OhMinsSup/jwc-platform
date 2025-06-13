import type { Form } from "@jwc/schema";
import type { Payload, TypeWithID } from "payload";

interface FindFormByUserOptions
	extends Pick<Form, "name" | "phone" | "ageGroup" | "gender" | "department"> {}

/**
 * 폼 정보를 등록한다.
 * @param payload - Payload 인스턴스
 * @param data - 등록할 폼의 데이터
 */
export async function createForm(payload: Payload, data: Form) {
	const created = await payload.create({
		collection: "forms",
		data,
	});
	return created as unknown as Promise<TypeWithID & Form>;
}

/**
 * 폼 정보를 수정한다.
 * @param payload - Payload 인스턴스
 * @param id - 수정할 폼의 ID
 * @param data - 수정할 폼의 데이터
 */
export async function updateForm(
	payload: Payload,
	id: string | number,
	data: Form
) {
	const updated = await payload.update({
		collection: "forms",
		id,
		data,
	});
	return updated as unknown as Promise<TypeWithID & Form>;
}

/**
 * 이름, 번호, 성별, 또래가 일치하는 폼을 찾습니다.
 * @param payload - Payload 인스턴스
 * @param options - 검색 조건
 */
export async function findFormByUser(
	payload: Payload,
	options: FindFormByUserOptions
) {
	const { phone, name, gender, ageGroup } = options;
	const data = await payload.find({
		collection: "forms",
		where: {
			and: [
				{ name: { equals: name } },
				{ gender: { equals: gender } },
				{ ageGroup: { equals: ageGroup } },
			],
		},
		sort: "-createdAt",
	});

	const exists = data.docs.filter((doc) => doc.phone === phone);

	if (exists.length === 0) {
		return undefined;
	}

	if (exists.length > 1) {
		payload.logger.warn(
			`Multiple forms found for user ${name}. Returning the most recent one.`
		);
	}

	return exists.at(-1) as unknown as Promise<(TypeWithID & Form) | undefined>;
}

/**
 * 폼 정보를 등록한다.
 * @param payload - Payload 인스턴스
 * @param data - 등록할 폼의 데이터
 */
export async function createFormService(payload: Payload, data: Form) {
	const response = await createForm(payload, data);
	return {
		success: true,
		data: response,
		message: "신청서가 등록되었습니다.",
	};
}

/**
 * 폼 정보를 수정한다.
 * @param payload - Payload 인스턴스
 * @param id - 수정할 폼의 ID
 * @param data - 수정할 폼의 데이터
 */
export async function updateFormService(
	payload: Payload,
	id: string | number,
	data: Form
) {
	const response = await updateForm(payload, id, data);
	return {
		success: true,
		data: response,
		message: "신청서가 수정되었습니다.",
	};
}

/**
 * 폼 정보를 등록 또는 수정한다.
 * @param payload - Payload 인스턴스
 * @param data - 등록할 폼의 데이터
 */
export async function upsertFormService(payload: Payload, data: Form) {
	const exists = await findFormByUser(payload, data);

	// 차량 지원 여부가 false이고 차량 지원 상세 내용이 있는 경우 차량 지원 여부를 true로 변경
	if (
		!data.carSupport &&
		(data.carSupportContent ||
			(data.carSupportContent && data.carSupportContent.length > 0))
	) {
		Object.assign(data, {
			carSupport: true,
		});
	}

	const result = exists
		? await updateFormService(payload, exists.id, data)
		: await createFormService(payload, data);

	return {
		...result,
		data: result.data.id,
	};
}
