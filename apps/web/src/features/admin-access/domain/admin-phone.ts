import { normalizePhone } from "@jwc/form-core/field-types/text";
import { z } from "zod";

export const AdminPhoneSchema = z
	.string()
	.max(32)
	.transform(normalizePhone)
	.pipe(z.string().regex(/^01[016789]\d{7,8}$/u));
const EntriesSchema = z.array(z.tuple([z.email(), AdminPhoneSchema]));

export function parseAdminPhones(value: string): ReadonlyMap<string, string> {
	const entries = value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => entry.split("=").map((part) => part.trim().toLowerCase()));
	const parsed = EntriesSchema.safeParse(entries);
	if (!parsed.success) {
		throw new Error("ADMIN_PHONES는 이메일=휴대전화번호 형식으로 설정해주세요");
	}
	const mapping = new Map(parsed.data);
	if (
		mapping.size !== parsed.data.length ||
		new Set(mapping.values()).size !== mapping.size
	) {
		throw new Error("ADMIN_PHONES의 이메일과 전화번호는 중복될 수 없습니다");
	}
	return mapping;
}
