import type { AnswerValue } from "@jwc/form-core/answers/value";
import type { FieldDef } from "@jwc/form-core/definition/fields";

export interface FieldProps<F extends FieldDef = FieldDef> {
	field: F;
	/** input id (label 연결용) */
	inputId: string;
	invalid: boolean;
	onChange: (value: AnswerValue | undefined) => void;
	value: AnswerValue | undefined;
}
