import { ExcelManager } from "@jwc/excel";

/**
 * 주어진 데이터 배열과 시트 이름을 기반으로 엑셀 파일을 생성하여 Buffer로 반환합니다.
 *
 * @template Data 각 행을 나타내는 객체 타입
 * @param name 생성할 시트의 이름
 * @param docs 엑셀에 기록할 데이터 배열
 * @returns 생성된 엑셀 파일의 Buffer를 반환하는 Promise
 *
 * @example
 * ```typescript
 * const buffer = await buildExcelFileBuffer("Sheet1", [{ name: "홍길동", age: 30 }]);
 * // buffer를 파일로 저장하거나 네트워크로 전송할 수 있습니다.
 * ```
 */
export const buildExcelFileBuffer = async <
	Data extends Record<string, unknown> = Record<string, unknown>,
>(
	name: string,
	docs: Data[]
): Promise<Buffer> => {
	const $excel = new ExcelManager();

	try {
		const workbook = $excel.createWorkbook();

		const sheet = $excel.createSheet(workbook, name);

		const headers = $excel.head.createFormSheetHeaders();

		const rows = $excel.rowData.generateExcelFormRows(docs);

		$excel.generateExcel({
			workbook,
			sheet,
			headers,
			rows,
		});

		const buffer = await workbook.xlsx.writeBuffer();

		return buffer as Buffer;
	} finally {
		$excel.destroyWorkbook();
	}
};
