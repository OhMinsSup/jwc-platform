import type { Department } from "@jwc/schema";

// 소속 옵션
export const DEPARTMENTS: { value: Department; label: string }[] = [
	{ value: "youth1", label: "청년1부" },
	{ value: "youth2", label: "청년2부" },
	{ value: "other", label: "기타" },
];

// 연령대 옵션
export const AGE_GROUPS: { value: string; label: string }[] = [
	{ value: "86또래", label: "86또래" },
	{ value: "87또래", label: "87또래" },
	{ value: "88또래", label: "88또래" },
	{ value: "89또래", label: "89또래" },
	{ value: "90또래", label: "90또래" },
	{ value: "91또래", label: "91또래" },
	{ value: "92또래", label: "92또래" },
	{ value: "93또래", label: "93또래" },
	{ value: "94또래", label: "94또래" },
	{ value: "95또래", label: "95또래" },
	{ value: "96또래", label: "96또래" },
	{ value: "97또래", label: "97또래" },
	{ value: "98또래", label: "98또래" },
	{ value: "99또래", label: "99또래" },
	{ value: "00또래", label: "00또래" },
	{ value: "01또래", label: "01또래" },
	{ value: "02또래", label: "02또래" },
	{ value: "03또래", label: "03또래" },
	{ value: "04또래", label: "04또래" },
	{ value: "05또래", label: "05또래" },
	{ value: "06또래", label: "06또래" },
	{ value: "07또래", label: "07또래" },
];
