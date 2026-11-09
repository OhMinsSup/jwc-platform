/**
 * Platforms where tsrs is verified; 0.20 also ships win32-x64 and darwin-x64
 * binaries, but those stay on TypeScript 6 until verified.
 * @param {string} platform - `process.platform` 값 (예: "darwin", "linux")
 * @param {string} arch - `process.arch` 값 (예: "arm64", "x64")
 * @returns {"tsrs" | "typescript"} 실행할 컴파일러 패키지 이름
 */
export function selectCompiler(platform, arch) {
	if (
		(platform === "darwin" && arch === "arm64") ||
		(platform === "linux" && (arch === "x64" || arch === "arm64"))
	) {
		return "tsrs";
	}
	return "typescript";
}
