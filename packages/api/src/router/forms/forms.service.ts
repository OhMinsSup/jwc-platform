import type { Form } from "@jwc/schema";
import type { FormsRepository } from "./forms.repository";

export class FormsService {
	constructor(private readonly formsRepository: FormsRepository) {}

	/**
	 * 폼 정보를 등록한다.
	 * @param data - 등록할 폼의 데이터
	 */
	async create(data: Form) {
		const response = await this.formsRepository.createForm(data);
		return {
			success: true,
			data: response,
			message: "신청서가 등록되었습니다.",
		};
	}

	/**
	 * 폼 정보를 수정한다.
	 * @param id - 수정할 폼의 ID
	 * @param data - 수정할 폼의 데이터
	 */
	async update(id: string | number, data: Form) {
		const response = await this.formsRepository.updateForm(id, data);
		return {
			success: true,
			data: response,
			message: "신청서가 수정되었습니다.",
		};
	}

	/**
	 * 폼 정보를 등록한다.
	 * @param data - 등록할 폼의 데이터
	 */
	async upsert(data: Form) {
		const exists = await this.formsRepository.findFormByUser(data);

		// 차량 지원 여부가 false이고 차량 지원 상세 내용이 있는 경우
		// 차량 지원 여부를 true로 변경합니다.
		if (
			!data.carSupport &&
			(data.carSupportContent ||
				(data.carSupportContent && data.carSupportContent.length > 0))
		) {
			Object.assign(data, {
				carSupport: true,
			});
		}

		return exists
			? await this.update(exists.id, data)
			: await this.create(data);
	}
}
