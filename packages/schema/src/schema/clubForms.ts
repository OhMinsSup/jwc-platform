import { AsYouType } from "libphonenumber-js";
import { z } from "zod";

// 기본 ClubForm 스키마 (data 필드 제외)
const BaseClubFormSchema = z.object({
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
});

// 기본 스키마 (하위 호환성을 위해)
export const ClubFormSchema = BaseClubFormSchema.extend({
	data: z.record(z.string(), z.any()),
});

// 동적 컴포넌트 타입 정의
export interface DynamicComponent {
	id: string | number;
	title: string;
	type: "select" | "radio" | "description";
	description?: string;
	data?: {
		required?: boolean;
		data?: Array<
			| { id: string | number; name: string } // select 타입
			| { id: string | number; name: string; value: boolean | string } // radio 타입
		>;
	};
}

// 동적 스키마 생성 함수
export function createDynamicClubFormSchema(components: DynamicComponent[]) {
	// data 필드의 동적 스키마 생성
	const dataSchemaShape: Record<string, z.ZodSchema> = {};

	for (const component of components) {
		const fieldName = `component_${component.id}`;
		const isRequired = component.data?.required === true;

		let fieldSchema: z.ZodSchema;

		switch (component.type) {
			case "select": {
				// 선택형 필드 - name 기반
				const options =
					component.data?.data?.map((option) => option.name) || [];
				if (options.length > 0) {
					fieldSchema = z.enum(options as [string, ...string[]], {
						message: `${component.title}을(를) 선택해주세요`,
					});
				} else {
					fieldSchema = z
						.string()
						.min(1, `${component.title}을(를) 선택해주세요`);
				}
				break;
			}
			case "radio": {
				// 라디오 필드 - value 기반 (boolean | string)
				const options = component.data?.data || [];
				if (options.length > 0) {
					// value 값들을 추출해서 유니온 타입으로 만듦
					const values = options.map((option) => {
						const radioOption = option as { value: boolean | string };
						const value = radioOption.value;
						return typeof value === "boolean"
							? value.toString()
							: String(value);
					});

					if (values.length > 0) {
						fieldSchema = z.enum(values as [string, ...string[]], {
							message: `${component.title}을(를) 선택해주세요`,
						});
					} else {
						fieldSchema = z
							.string()
							.min(1, `${component.title}을(를) 선택해주세요`);
					}
				} else {
					fieldSchema = z
						.string()
						.min(1, `${component.title}을(를) 선택해주세요`);
				}
				break;
			}
			case "description": {
				// 서술형 필드
				fieldSchema = z
					.string()
					.min(1, `${component.title}을(를) 입력해주세요`)
					.transform((value) => value.trim());
				break;
			}
			default: {
				fieldSchema = z.string();
				break;
			}
		}

		// required가 false인 경우 optional로 만듦
		if (!isRequired) {
			fieldSchema = fieldSchema.optional().or(z.literal(""));
		}

		dataSchemaShape[fieldName] = fieldSchema;
	}

	// 동적 data 스키마 생성
	const dynamicDataSchema = z.object(dataSchemaShape);

	// 기본 스키마와 동적 data 스키마 결합
	return BaseClubFormSchema.extend({
		data: dynamicDataSchema,
	});
}

export type ClubForm = z.infer<typeof ClubFormSchema>;
