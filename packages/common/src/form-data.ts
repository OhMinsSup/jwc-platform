/**
 * 폼 제출값(FormData)에서 글자 입력값을 꺼낸다. 없거나 파일(File)이면 "".
 *
 * text/email/password 입력은 항상 문자열이므로 `String(data.get(name) ?? "")`와 같은 결과다.
 */
export function formText(data: FormData, name: string): string {
	const value = data.get(name);
	return typeof value === "string" ? value : "";
}
