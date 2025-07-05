import { AsYouType } from "libphonenumber-js";
import { z } from "zod";

export const ClubFormSchema = z.object({
	clubId: z
		.union([z.string().min(1), z.number().int().min(1)])
		.transform((value) =>
			typeof value === "string" ? Number.parseInt(value, 10) : value
		),
	name: z
		.string()
		.min(1, "이름을 입력해주세요.")
		.max(10, "이름은 10자 이내로 입력해주세요.")
		.transform((value) => value.trim()),
	phone: z
		.string()
		.min(9, "유효한 전화번호를 입력해주세요.")
		.max(11, "유효한 전화번호를 입력해주세요.")
		.transform((value) => value.trim())
		.refine((value) => {
			const asYouType = new AsYouType("KR");
			asYouType.input(value);
			const number = asYouType.getNumber();
			return number?.isValid() ?? false;
		}, "유효한 전화번호를 입력해주세요."),
	department: z.enum(["청년1부", "청년2부", "기타"], {
		message: "소속을 선택해주세요.",
	}),
	ageGroup: z
		.string()
		.min(1, "또래를 적어주세요.")
		.transform((value) => value.trim())
		.refine(
			(value) => {
				// (숫자)또래 형식 예시 (00또래)
				const regex = /^[0-9]{2}또래$/;
				if (!regex.test(value)) {
					return false;
				}
				return true;
			},
			{
				message: "또래를 숫자 2자리로 입력해주세요. (예시: 00또래)",
			}
		),
	data: z.record(z.string(), z.any()),
});

export type ClubForm = z.infer<typeof ClubFormSchema>;
