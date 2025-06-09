/**
 * ArrayBuffer를 문자열로 변환합니다.
 * @param buf - 변환할 ArrayBuffer
 * @returns 변환된 문자열
 */
export function ab2str(buf: ArrayBuffer): string {
	const bufView = new Uint16Array(buf);
	return String.fromCharCode(...bufView);
}

/**
 * 문자열을 ArrayBuffer로 변환합니다.
 * @param str - 변환할 문자열
 * @returns 변환된 ArrayBuffer
 */
export function str2ab(str: string): ArrayBuffer {
	const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
	const bufView = new Uint16Array(buf);
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}
