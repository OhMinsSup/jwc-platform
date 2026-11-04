import { parseFormDefinition } from "../src/definition/definition";
import type { FormDefinition } from "../src/definition/definition";
import { retreat2026Definition } from "../src/samples/retreat-2026";

export function retreat(): FormDefinition {
	const parsed = parseFormDefinition(retreat2026Definition);
	if (!parsed.ok) {
		throw new Error(JSON.stringify(parsed.issues));
	}
	return parsed.definition;
}

export const validRetreatAnswers = {
	name: "홍길동",
	phone: "010-1234-5678",
	gender: "male",
	department: "youth1",
	age_group: "y95",
	stay_type: "n1d2",
	arrival_at: "2026-06-26T14:30",
	arrival_note: "오후 도착",
	tf_team: "none",
	can_ride: false,
};
