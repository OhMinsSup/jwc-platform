import { AsYouType } from "libphonenumber-js";
import { z } from "zod";

export const FormSchema = z.object({
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
	gender: z.enum(["남성", "여성"], {
		message: "성별을 선택해주세요.",
	}),
	department: z.enum(["청년1부", "청년2부", "기타"], {
		message: "소속을 선택해주세요.",
	}),
	isPaid: z.boolean().default(false),
	pickupTimeDesc: z
		.string()
		.max(500, {
			message: "픽업 시간 내용을 500자 이내로 입력해주세요.",
		})
		.optional(),
	numberOfStays: z.enum(["3박4일", "2박3일", "1박2일", "무박"], {
		message: "참석 유형을 선택해주세요.",
	}),
	tfTeam: z.enum(["찬양팀", "프로그램팀", "미디어팀", "없음"]).optional(),
	carSupport: z.boolean().default(false),
	carSupportContent: z
		.string()
		.max(500, {
			message: "차량 지원 내용을 500자 이내로 입력해주세요.",
		})
		.optional(),
	tshirtSize: z.enum(["s", "m", "l", "xl", "2xl", "3xl"]).optional(),
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
	attendanceDay: z.string().optional(),
	attendanceTime: z.enum(["AM", "PM", "EVENING"]).optional(),
});

export type Form = z.infer<typeof FormSchema>;
