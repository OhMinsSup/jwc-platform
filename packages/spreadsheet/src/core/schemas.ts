/**
 * @fileoverview 미리 정의된 스프레드시트 스키마
 *
 * 자주 사용되는 폼 데이터 타입에 대한 스키마를 정의합니다.
 */

import type { IColumnDefinition, ISpreadsheetSchema } from "./interfaces";

/**
 * 수련회 신청서 데이터 타입
 */
export interface RetreatFormData {
	createdAt: string;
	name: string;
	gender: string;
	age: string;
	phone: string;
	baptism: string;
	newFriends: string;
	inChurch: string;
	team: string;
	transportation: string;
	retreatDays: string;
	payed: string;
	attendance: string;
	/** 동적 폼 컴포넌트 데이터 */
	components?: Array<{
		id: string;
		name: string;
		value: unknown;
	}>;
}

/**
 * 동아리 신청서 데이터 타입
 */
export interface ClubFormData {
	createdAt: string;
	name: string;
	phone: string;
	club: { name: string } | string;
	group: string;
	payed: string;
	attendance: string;
	/** 동적 폼 컴포넌트 데이터 */
	components?: Array<{
		id: string;
		name: string;
		value: unknown;
	}>;
}

/**
 * 일반 폼 데이터 타입
 */
export interface GenericFormData {
	createdAt: string;
	[key: string]: unknown;
}

/**
 * 수련회 신청서 스키마
 */
export const retreatFormSchema: ISpreadsheetSchema<RetreatFormData> = {
	name: "retreatForm",
	description: "수련회 신청서 스프레드시트 스키마",
	defaultSheetName: "수련회신청자",
	columns: [
		{
			key: "createdAt",
			header: "신청일시",
			type: "datetime",
			width: 18,
		},
		{
			key: "name",
			header: "이름",
			type: "text",
			width: 12,
			required: true,
		},
		{
			key: "gender",
			header: "성별",
			type: "dropdown",
			width: 8,
			options: ["남", "여"],
		},
		{
			key: "age",
			header: "나이",
			type: "text",
			width: 8,
		},
		{
			key: "phone",
			header: "전화번호",
			type: "text",
			width: 15,
		},
		{
			key: "baptism",
			header: "세례여부",
			type: "dropdown",
			width: 10,
			options: ["예", "아니오", "모름"],
		},
		{
			key: "newFriends",
			header: "새친구",
			type: "boolean",
			width: 10,
		},
		{
			key: "inChurch",
			header: "교회출석",
			type: "boolean",
			width: 10,
		},
		{
			key: "team",
			header: "팀",
			type: "text",
			width: 10,
		},
		{
			key: "transportation",
			header: "교통수단",
			type: "text",
			width: 12,
		},
		{
			key: "retreatDays",
			header: "참가일수",
			type: "text",
			width: 10,
		},
		{
			key: "payed",
			header: "입금여부",
			type: "dropdown",
			width: 10,
			options: ["미확인", "확인"],
		},
		{
			key: "attendance",
			header: "출석여부",
			type: "dropdown",
			width: 10,
			options: ["예정", "출석", "결석"],
		},
	],
};

/**
 * 동아리 신청서 스키마
 */
export const clubFormSchema: ISpreadsheetSchema<ClubFormData> = {
	name: "clubForm",
	description: "동아리 신청서 스프레드시트 스키마",
	defaultSheetName: "동아리신청자",
	columns: [
		{
			key: "createdAt",
			header: "신청일시",
			type: "datetime",
			width: 18,
		},
		{
			key: "name",
			header: "이름",
			type: "text",
			width: 12,
			required: true,
		},
		{
			key: "phone",
			header: "전화번호",
			type: "text",
			width: 15,
		},
		{
			key: "club",
			header: "동아리",
			type: "text",
			width: 15,
			formatter: (value) => {
				if (typeof value === "object" && value !== null && "name" in value) {
					return (value as { name: string }).name;
				}
				return String(value || "");
			},
		},
		{
			key: "group",
			header: "목장",
			type: "text",
			width: 12,
		},
		{
			key: "payed",
			header: "입금여부",
			type: "dropdown",
			width: 10,
			options: ["미확인", "확인"],
		},
		{
			key: "attendance",
			header: "출석여부",
			type: "dropdown",
			width: 10,
			options: ["예정", "출석", "결석"],
		},
	],
};

// ============================================================================
// 스키마 빌더 헬퍼
// ============================================================================

/**
 * 동적 컴포넌트 컬럼을 스키마에 추가
 */
export function addDynamicColumns<T>(
	schema: ISpreadsheetSchema<T>,
	componentNames: string[]
): ISpreadsheetSchema<T> {
	const dynamicColumns: IColumnDefinition<T>[] = componentNames.map((name) => ({
		key: `component_${name}` as keyof T & string,
		header: name,
		type: "text" as const,
		width: 15,
	}));

	return {
		...schema,
		columns: [...schema.columns, ...dynamicColumns],
	};
}

/**
 * 컬럼을 추가하여 새 스키마 생성
 */
export function extendSchema<T, U>(
	baseSchema: ISpreadsheetSchema<T>,
	additionalColumns: IColumnDefinition<U>[],
	options?: {
		name?: string;
		description?: string;
		defaultSheetName?: string;
	}
): ISpreadsheetSchema<T & U> {
	return {
		name: options?.name || baseSchema.name,
		description: options?.description || baseSchema.description,
		defaultSheetName: options?.defaultSheetName || baseSchema.defaultSheetName,
		columns: [
			...(baseSchema.columns as IColumnDefinition<T & U>[]),
			...(additionalColumns as IColumnDefinition<T & U>[]),
		],
	};
}

/**
 * 특정 컬럼만 포함하는 스키마 생성
 */
export function pickColumns<T>(
	schema: ISpreadsheetSchema<T>,
	keys: Array<keyof T & string>
): ISpreadsheetSchema<T> {
	const keySet = new Set<string>(keys);
	return {
		...schema,
		columns: schema.columns.filter((col) => keySet.has(col.key as string)),
	};
}

/**
 * 특정 컬럼을 제외한 스키마 생성
 */
export function omitColumns<T>(
	schema: ISpreadsheetSchema<T>,
	keys: Array<keyof T & string>
): ISpreadsheetSchema<T> {
	const keySet = new Set<string>(keys);
	return {
		...schema,
		columns: schema.columns.filter((col) => !keySet.has(col.key as string)),
	};
}
