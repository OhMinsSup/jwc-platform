import type { Condition } from "@jwc/form-core/definition/condition";
import type {
	FormDefinition,
	NotificationKind,
	PageDef,
	PaymentDef,
} from "@jwc/form-core/definition/definition";
import type {
	ChoiceOption,
	FieldDef,
	FieldType,
} from "@jwc/form-core/definition/fields";

/**
 * 편집기에서 일어나는 모든 변경은 이 데이터 중 하나다.
 * - 새 항목의 id는 디스패치하는 쪽이 정해서 넣는다 → 리듀서는 결정적이고, UI는 새 항목을 바로 찾을 수 있다.
 * - 핸들러는 type별 테이블(reducer.ts)에서 조회한다.
 */
export type MetaPatch = Partial<
	Pick<
		FormDefinition,
		"title" | "description" | "timezone" | "closesAt" | "completionMessage"
	>
>;

/** 유니온의 어느 멤버든 일부 속성만 바꾸는 패치 (id/type 변경은 전용 액션으로) */
export type FieldPatch = Partial<Omit<FieldDef, "id" | "type">> &
	Record<string, unknown>;

type PagePatch = Partial<Pick<PageDef, "title" | "description">> & {
	showIf?: Condition | undefined;
};

type OptionPatch = Partial<Pick<ChoiceOption, "label" | "description">>;

type PaymentPatch = Partial<Pick<PaymentDef, "account" | "amount">>;

export type FieldAction =
	| { type: "field/add"; pageId: string; fieldId: string; fieldType: FieldType }
	| { type: "field/update"; fieldId: string; patch: FieldPatch }
	| { type: "field/changeType"; fieldId: string; fieldType: FieldType }
	| { type: "field/rename"; from: string; to: string }
	| { type: "field/duplicate"; fieldId: string; newId: string }
	| { type: "field/remove"; fieldId: string }
	| { type: "field/move"; fieldId: string; pageId: string; index: number }
	| { type: "option/add"; fieldId: string; labels: string[] }
	| {
			type: "option/update";
			fieldId: string;
			index: number;
			patch: OptionPatch;
	  }
	| { type: "option/rename"; fieldId: string; from: string; to: string }
	| { type: "option/remove"; fieldId: string; value: string }
	| { type: "option/move"; fieldId: string; from: number; to: number };

export type PageAction =
	| { type: "page/add"; pageId: string }
	| { type: "page/update"; pageId: string; patch: PagePatch }
	| { type: "page/remove"; pageId: string }
	| { type: "page/move"; pageId: string; delta: -1 | 1 };

export type SettingsAction =
	| { type: "meta/update"; patch: MetaPatch }
	| { type: "identity/set"; fieldId: string }
	| { type: "sms/set"; phoneFieldId: string | null }
	/** template = null 이면 해당 알림을 끈다 */
	| {
			type: "notification/set";
			kind: NotificationKind;
			template: string | null;
	  }
	| { type: "payment/set"; enabled: boolean }
	| { type: "payment/update"; patch: PaymentPatch }
	| { type: "reset"; definition: FormDefinition };

export type EditorAction = FieldAction | PageAction | SettingsAction;
export type EditorDispatch = (action: EditorAction) => void;
