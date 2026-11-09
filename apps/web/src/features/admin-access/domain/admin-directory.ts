import { z } from "zod";

import { parseAdminPhones } from "./admin-phone";
import { normalizeEmail } from "./admin-signup";

export interface AdminRegistration {
	email: string;
	phoneNumber: string | null;
}

const EmailsSchema = z.array(z.email());

export function parseAdminDirectory(config: {
	emails: string;
	phones: string;
}): ReadonlyMap<string, AdminRegistration> {
	const entries = config.emails.split(",").map(normalizeEmail).filter(Boolean);
	const parsed = EmailsSchema.safeParse(entries);
	if (!parsed.success) {
		throw new Error(
			"ADMIN_EMAILS는 올바른 이메일을 쉼표로 구분해 설정해주세요",
		);
	}
	const phones = parseAdminPhones(config.phones);
	return new Map(
		parsed.data.map((email) => [
			email,
			{
				email,
				phoneNumber: phones.get(email) ?? null,
			},
		]),
	);
}
