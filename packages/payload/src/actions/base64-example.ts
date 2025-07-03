// 대안적인 방법 - Base64 인코딩을 사용한 서버 액션 예시
// 주의: 큰 파일의 경우 메모리 사용량이 많아질 수 있습니다

export async function downloadExcelFileActionBase64(): Promise<
	NonNullable<State>
> {
	try {
		const result = await SpreadsheetApi.downloadExcel();

		if (result.success && result.data) {
			// ArrayBuffer를 Base64로 인코딩
			const arrayBuffer = result.data as ArrayBuffer;
			const base64 = Buffer.from(arrayBuffer).toString("base64");

			const timestamp = new Date()
				.toISOString()
				.slice(0, 19)
				.replace(/:/g, "-");
			const filename = `청년부_연합_여름_수련회_참가자_명단_${timestamp}.xlsx`;

			return {
				success: true,
				message: "Excel file generated successfully",
				data: base64, // Base64 문자열로 전달
				filename,
				format: "excel",
			};
		}

		return {
			success: false,
			message: result.message || "Failed to generate Excel file",
			format: "excel",
		};
	} catch (error) {
		log.error("serverActions", error as Error, {
			name: "downloadExcel",
			action: "download-excel",
		});
		return {
			success: false,
			message: "An error occurred while generating Excel file",
			format: "excel",
		};
	}
}

// 클라이언트에서 Base64를 다시 Blob으로 변환
function base64ToBlob(base64: string, mimeType: string): Blob {
	const byteCharacters = atob(base64);
	const byteArrays = [];

	for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
		const slice = byteCharacters.slice(offset, offset + 1024);
		const byteNumbers = new Array(slice.length);

		for (let i = 0; i < slice.length; i++) {
			byteNumbers[i] = slice.charCodeAt(i);
		}

		const byteArray = new Uint8Array(byteNumbers);
		byteArrays.push(byteArray);
	}

	return new Blob(byteArrays, { type: mimeType });
}
