import crypto from "node:crypto";
import utils from "node:util";
import type { Form } from "@jwc/schema";
import type { FormsRepository } from "./forms.repository";

const randomBytesPromise = utils.promisify(crypto.randomBytes);
const pbkdf2Promise = utils.promisify(crypto.pbkdf2);

export class FormsService {
	constructor(private readonly formsRepository: FormsRepository) {}

	/**
	 * 랜덤한 salt를 생성합니다.
	 * @returns 랜덤한 salt
	 */
	async generateSalt() {
		const buf = await randomBytesPromise(32);
		return buf.toString("base64");
	}

	/**
	 * 해시를 생성합니다.
	 * @param value - 해시로 만들 값
	 */
	async generateHashed(value: string) {
		const salt = await this.generateSalt();
		const key = await pbkdf2Promise(value, salt, 104906, 64, "sha512");
		const password = key.toString("base64");
		return `${salt}:${password}`;
	}

	/**
	 * 해시를 검증합니다.
	 * @param value - 검증할 값
	 * @param hash - 해시
	 */
	async verify(value: string, hash: string) {
		const [salt, password] = hash.split(":");
		if (!salt || !password) {
			return false;
		}
		const key = await pbkdf2Promise(value, salt, 104906, 64, "sha512");
		return key.toString("base64") === password;
	}

	/**
	 * 폼 정보를 등록한다.
	 * @param data - 등록할 폼의 데이터
	 */
	async createForm(data: Form) {
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
	async updateForm(id: string | number, data: Form) {
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
	async upsertForm(data: Form) {
		const hashedPhone = await this.generateHashed(data.phone);
		const exists = await this.formsRepository.findFormByNameWithPhoneNumber(
			data.name,
			hashedPhone
		);

		const newData = {
			...data,
			hashedPhone,
		};

		return exists
			? await this.updateForm(exists.id, newData)
			: await this.createForm(newData);
	}
}
