import type { Form } from "@jwc/schema";
import type { Payload, TypeWithID, Where } from "payload";

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
	 * @param hashedPhoneNumber - 폼 번호
	 */
	async findFormByNameWithPhoneNumber(name: string, hashedPhoneNumber: string) {
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
						hashedPhone: {
							equals: hashedPhoneNumber,
						},
					},
				],
			},
			limit: 1,
		});
		return data.docs.at(-1) as unknown as Promise<
			(TypeWithID & Form) | undefined
		>;
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
