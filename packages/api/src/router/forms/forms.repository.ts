import type { Form } from "@jwc/schema";
import type { Payload, TypeWithID, Where } from "payload";

interface FindFormByUserOptions
	extends Pick<Form, "name" | "phone" | "ageGroup" | "gender" | "department"> {}

export class FormsRepository {
	constructor(private readonly payload: Payload) {}

	/**
	 * 폼 정보를 등록한다.
	 * @param data - 등록할 폼의 데이터
	 */
	async createForm(data: Form) {
		const created = await this.payload.create({
			collection: "forms",
			data,
		});
		return created as unknown as Promise<TypeWithID & Form>;
	}

	/**
	 * 폼 정보를 수정한다.
	 * @param id - 수정할 폼의 ID
	 * @param data - 수정할 폼의 데이터
	 */
	async updateForm(id: string | number, data: Form) {
		const updated = await this.payload.update({
			collection: "forms",
			id,
			data,
		});
		return updated as unknown as Promise<TypeWithID & Form>;
	}

	/**
	 * 이름과 번호가 일치하는 폼을 찾습니다.
	 * @param name - 폼 이름
	 * @param phone - 폼 번호
	 */
	async findFormByUser(options: FindFormByUserOptions) {
		const { phone, name, gender, ageGroup } = options;
		const data = await this.payload.find({
			collection: "forms",
			where: {
				and: [
					{
						name: {
							equals: name,
						},
					},
					{
						gender: {
							equals: gender,
						},
					},
					{
						ageGroup: {
							equals: ageGroup,
						},
					},
				],
			},
			sort: "-createdAt",
		});

		const exists = data.docs.filter((doc) => doc.phone === phone);

		if (exists.length === 0) {
			return undefined;
		}

		if (exists.length > 1) {
			this.payload.logger.warn(
				`Multiple forms found for user ${name}. Returning the most recent one.`
			);
		}

		return exists.at(-1) as unknown as Promise<(TypeWithID & Form) | undefined>;
	}

	/**
	 * 폼 목록을 가져옵니다.
	 * @param options - 검색 조건
	 */
	async findForms(options?: Where) {
		return await this.payload.find({
			collection: "forms",
			where: options,
		});
	}
}
