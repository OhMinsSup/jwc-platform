import { DEFINITION_LIMITS } from "@jwc/form-core";
import type { ChoiceOption, FieldDef, FormDefinition } from "@jwc/form-core";

import type { FieldAction } from "./actions";
import { insertAt, moveItem, replaceWhere } from "./collections";
import { changeFieldType, createField } from "./field-catalog";
import { ID_PREFIX, uniqueId } from "./ids";
import { updateOptionRefs } from "./option-references";
import { removeField, renameField } from "./references";

const UNTITLED_QUESTION = "제목 없는 질문";
const COPY_SUFFIX = " (복사본)";

type State = FormDefinition;
type Handler<T extends FieldAction["type"]> = (
	state: State,
	action: Extract<FieldAction, { type: T }>,
) => State;
export type FieldHandlers = { [T in FieldAction["type"]]: Handler<T> };

function updateField(
	state: State,
	fieldId: string,
	update: (field: FieldDef) => FieldDef,
): State {
	return {
		...state,
		fields: replaceWhere(state.fields, (f) => f.id === fieldId, update),
	};
}

function hasField(state: State, fieldId: string): boolean {
	return state.fields.some((field) => field.id === fieldId);
}

/** 페이지에 필드를 끼워 넣고 다른 페이지에서는 뺀다 (항상 한 페이지에만 배치) */
function placeField(
	state: State,
	fieldId: string,
	pageId: string,
	index: number,
): State {
	return {
		...state,
		pages: state.pages.map((page) => {
			const without = page.fieldIds.filter((id) => id !== fieldId);
			if (page.id === pageId) {
				return { ...page, fieldIds: insertAt(without, index, fieldId) };
			}
			return without.length === page.fieldIds.length
				? page
				: { ...page, fieldIds: without };
		}),
	};
}

function updateOptions(
	state: State,
	fieldId: string,
	update: (options: ChoiceOption[]) => ChoiceOption[],
): State {
	return updateField(state, fieldId, (field) =>
		"options" in field ? { ...field, options: update(field.options) } : field,
	);
}

function optionValuesOf(state: State, fieldId: string): Set<string> {
	const field = state.fields.find((f) => f.id === fieldId);
	return new Set(
		field && "options" in field ? field.options.map((o) => o.value) : [],
	);
}

const addField: Handler<"field/add"> = (state, action) => {
	const page = state.pages.find((p) => p.id === action.pageId);
	if (
		!page ||
		hasField(state, action.fieldId) ||
		state.fields.length >= DEFINITION_LIMITS.fields
	) {
		return state;
	}
	const field = createField(
		action.fieldType,
		action.fieldId,
		UNTITLED_QUESTION,
	);
	return placeField(
		{ ...state, fields: [...state.fields, field] },
		field.id,
		page.id,
		page.fieldIds.length,
	);
};

const duplicateField: Handler<"field/duplicate"> = (state, action) => {
	const source = state.fields.find((f) => f.id === action.fieldId);
	const page = state.pages.find((p) => p.fieldIds.includes(action.fieldId));
	if (!(source && page) || hasField(state, action.newId)) {
		return state;
	}
	const copy: FieldDef = {
		...source,
		id: action.newId,
		label: `${source.label}${COPY_SUFFIX}`,
		columnHeader: undefined,
	};
	const position = page.fieldIds.indexOf(action.fieldId) + 1;
	return placeField(
		{ ...state, fields: [...state.fields, copy] },
		copy.id,
		page.id,
		position,
	);
};

const addOptions: Handler<"option/add"> = (state, action) => {
	const taken = optionValuesOf(state, action.fieldId);
	const room = DEFINITION_LIMITS.options - taken.size;
	const created = action.labels.slice(0, Math.max(0, room)).map((label) => {
		const value = uniqueId(ID_PREFIX.option, taken);
		taken.add(value);
		return { value, label };
	});
	return created.length === 0
		? state
		: updateOptions(state, action.fieldId, (options) => [
				...options,
				...created,
			]);
};

export const FIELD_HANDLERS: FieldHandlers = {
	"field/add": addField,
	"field/update": (state, { fieldId, patch }) =>
		updateField(state, fieldId, (field) => ({ ...field, ...patch })),
	"field/changeType": (state, { fieldId, fieldType }) =>
		updateField(state, fieldId, (field) =>
			field.type === fieldType ? field : changeFieldType(field, fieldType),
		),
	"field/rename": (state, { from, to }) =>
		from === to || hasField(state, to) ? state : renameField(state, from, to),
	"field/duplicate": duplicateField,
	"field/remove": (state, { fieldId }) => removeField(state, fieldId),
	"field/move": (state, { fieldId, pageId, index }) =>
		placeField(state, fieldId, pageId, index),
	"option/add": addOptions,
	"option/update": (state, { fieldId, index, patch }) =>
		updateOptions(state, fieldId, (options) =>
			options.map((option, i) =>
				i === index ? { ...option, ...patch } : option,
			),
		),
	"option/rename": (state, { fieldId, from, to }) =>
		from === to || optionValuesOf(state, fieldId).has(to)
			? state
			: updateOptionRefs(state, fieldId, from, to),
	"option/remove": (state, { fieldId, value }) =>
		updateOptionRefs(state, fieldId, value, null),
	"option/move": (state, { fieldId, from, to }) =>
		updateOptions(state, fieldId, (options) => moveItem(options, from, to)),
};
