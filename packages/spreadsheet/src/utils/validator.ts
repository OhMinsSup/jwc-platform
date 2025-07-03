import type {
	RowFormData,
	SpreadsheetConfig,
	SpreadsheetData,
} from "../core/types";

/**
 * 데이터 검증 유틸리티 함수들
 */

/**
 * 스프레드시트 설정을 검증합니다.
 * @param config - 검증할 설정 객체
 * @returns 검증 결과
 */
export function validateSpreadsheetConfig(config: SpreadsheetConfig): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (config.google) {
		if (
			!config.google.spreadsheetId ||
			config.google.spreadsheetId.trim() === ""
		) {
			errors.push("Google Sheets ID가 필요합니다.");
		}
		if (!config.google.sheetName || config.google.sheetName.trim() === "") {
			errors.push("Google Sheets 시트 이름이 필요합니다.");
		}
		if (!config.google.clientEmail || config.google.clientEmail.trim() === "") {
			errors.push("Google Client Email이 필요합니다.");
		}
		if (!config.google.privateKey || config.google.privateKey.trim() === "") {
			errors.push("Google Private Key가 필요합니다.");
		}
	}

	if (config.excel) {
		if (!config.excel.fileName || config.excel.fileName.trim() === "") {
			errors.push("Excel 파일명이 필요합니다.");
		}
		if (!config.excel.sheetName || config.excel.sheetName.trim() === "") {
			errors.push("Excel 시트 이름이 필요합니다.");
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * RowFormData 배열을 검증합니다.
 * @param data - 검증할 데이터 배열
 * @returns 검증 결과
 */
export function validateRowFormData(data: RowFormData[]): {
	isValid: boolean;
	errors: string[];
	validCount: number;
	invalidCount: number;
} {
	const errors: string[] = [];
	let validCount = 0;
	let invalidCount = 0;

	if (!Array.isArray(data)) {
		errors.push("데이터는 배열 형태여야 합니다.");
		return { isValid: false, errors, validCount: 0, invalidCount: 0 };
	}

	data.forEach((row, index) => {
		const rowErrors: string[] = [];

		// 필수 필드 검증
		if (!row.이름 || row.이름.trim() === "") {
			rowErrors.push(`${index + 1}행: 이름이 필요합니다.`);
		}
		if (!row.연락처 || row.연락처.trim() === "") {
			rowErrors.push(`${index + 1}행: 연락처가 필요합니다.`);
		}
		if (!row.성별 || row.성별.trim() === "") {
			rowErrors.push(`${index + 1}행: 성별이 필요합니다.`);
		}
		if (!row.부서 || row.부서.trim() === "") {
			rowErrors.push(`${index + 1}행: 부서가 필요합니다.`);
		}

		// 성별 값 검증
		if (row.성별 && !["남성", "여성"].includes(row.성별)) {
			rowErrors.push(`${index + 1}행: 성별은 '남성' 또는 '여성'이어야 합니다.`);
		}

		// 부서 값 검증
		if (row.부서 && !["청년1부", "청년2부", "기타"].includes(row.부서)) {
			rowErrors.push(
				`${index + 1}행: 부서는 '청년1부', '청년2부', 또는 '기타' 중 하나여야 합니다.`
			);
		}

		// 회비 납입 여부 검증
		if (
			row["회비 납입 여부"] &&
			!["예", "아니오"].includes(row["회비 납입 여부"])
		) {
			rowErrors.push(
				`${index + 1}행: 회비 납입 여부는 '예' 또는 '아니오'여야 합니다.`
			);
		}

		if (rowErrors.length > 0) {
			errors.push(...rowErrors);
			invalidCount++;
		} else {
			validCount++;
		}
	});

	return {
		isValid: errors.length === 0,
		errors,
		validCount,
		invalidCount,
	};
}

/**
 * 데이터가 비어있는지 확인합니다.
 * @param data - 확인할 데이터
 * @returns 비어있는 여부
 */
export function isEmpty<T>(data: T[] | undefined | null): boolean {
	return !data || data.length === 0;
}

/**
 * 중복된 데이터를 제거합니다.
 * @param data - 중복 제거할 데이터 배열
 * @param keyExtractor - 중복 확인용 키 추출 함수
 * @returns 중복이 제거된 데이터 배열
 */
export function removeDuplicates<T>(
	data: T[],
	keyExtractor: (item: T) => string | number = (item) => JSON.stringify(item)
): T[] {
	const seen = new Set<string | number>();
	return data.filter((item) => {
		const key = keyExtractor(item);
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
}

/**
 * 안전하게 JSON을 파싱합니다.
 * @param jsonString - 파싱할 JSON 문자열
 * @param defaultValue - 파싱 실패 시 반환할 기본값
 * @returns 파싱된 객체 또는 기본값
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
	try {
		return JSON.parse(jsonString) as T;
	} catch {
		return defaultValue;
	}
}
