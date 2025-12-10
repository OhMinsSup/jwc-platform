/**
 * @fileoverview 유틸리티 함수들
 *
 * 스프레드시트 패키지에서 사용되는 공통 유틸리티 함수들입니다.
 */

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
