import { z } from "zod";

import {
	booleanSpec,
	multiChoiceSpec,
	ratingSpec,
	singleChoiceSpec,
} from "./choice";
import type { FieldTypeRegistry } from "./spec";
import { dateSpec, datetimeSpec, timeSpec } from "./temporal";
import { emailSpec, longTextSpec, phoneSpec, shortTextSpec } from "./text";

const numberSpec: FieldTypeRegistry["number"] = {
	valueSchema: (field) => {
		let schema = z.number("숫자를 입력해주세요");
		if (field.integer) {
			schema = schema.int("정수를 입력해주세요");
		}
		if (field.min !== undefined) {
			schema = schema.min(field.min, `${field.min} 이상 입력해주세요`);
		}
		if (field.max !== undefined) {
			schema = schema.max(field.max, `${field.max} 이하로 입력해주세요`);
		}
		return schema;
	},
	format: (_field, value) => String(value),
	fromText: (_field, text) => Number(text.replaceAll(",", "").trim()),
	sheet: { value: "number" },
};

/** 표시 전용. 답변을 받지 않으므로 어떤 값도 통과시키지 않는다. */
const statementSpec: FieldTypeRegistry["statement"] = {
	valueSchema: () => z.never(),
	format: () => "",
	fromText: () => {
		// 시트 컬럼이 없으므로 셀에서 읽을 값이 없다 (undefined → valueSchema가 거부)
	},
	// 시트 열이 없다 (isDisplayOnly)
	sheet: { value: "text" },
};

export const FIELD_TYPES: FieldTypeRegistry = {
	short_text: shortTextSpec,
	long_text: longTextSpec,
	number: numberSpec,
	phone: phoneSpec,
	email: emailSpec,
	single_choice: singleChoiceSpec,
	multi_choice: multiChoiceSpec,
	boolean: booleanSpec,
	date: dateSpec,
	time: timeSpec,
	datetime: datetimeSpec,
	rating: ratingSpec,
	statement: statementSpec,
};
