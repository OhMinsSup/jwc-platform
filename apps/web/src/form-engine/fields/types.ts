import type { AnswerValue, FieldDef } from "@jwc/form-core";

export interface FieldProps<F extends FieldDef = FieldDef> {
	field: F;
	/** input id (label 연결용) */
	inputId: string;
	invalid: boolean;
	onChange: (value: AnswerValue | undefined) => void;
	value: AnswerValue | undefined;
}
