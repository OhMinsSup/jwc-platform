import { log } from "@jwc/observability/log";
import { env } from "@jwc/payload/env";
import {
	SpreadsheetWebhookUtils,
	type WebhookBody,
} from "@jwc/payload/helpers/spreadsheet-webhook.utils";
import {
	DataConverter,
	GoogleSheetsSyncManager,
	type RowFormData,
	type SpreadsheetBuilder,
	createSpreadsheet,
} from "@jwc/spreadsheet";
import { APIError, headersWithCors } from "payload";
import type { PayloadRequest } from "payload";

/**
 * 동아리 신청서 데이터 타입
 */
interface ClubFormDoc {
	id: number;
	name: string;
	phone: string;
	department: string;
	ageGroup: string;
	club?: {
		id: number;
		title: string;
		components?: Array<{
			id: string;
			title: string;
			type?: string;
			data?: Record<string, unknown>; // options 대신 data 사용
		}>;
	};
	createdAt: string;
	data?: Record<string, unknown>;
}

/**
 * 동아리 신청서 Excel 데이터 타입
 */
interface ClubFormExcelData {
	이름: string;
	전화번호: string;
	부서: string;
	또래: string;
	동아리: string;
	신청일시: string;
	[key: string]: string;
}

/**
 * 통합 스프레드시트 관리 endpoint
 * Excel과 Google Sheets를 동시에 처리하는 통합 기능을 제공합니다.
 * GET: 스프레드시트 생성/동기화
 * POST: Google Sheets 웹훅 처리
 */
export const spreadsheetEndpoints = async (request: PayloadRequest) => {
	try {
		// HTTP 메서드에 따라 다른 처리
		if (request.method === "POST") {
			return await handleWebhook(request);
		}

		return await handleSpreadsheetRequest(request);
	} catch (error) {
		log.error("endpoints", error as Error, {
			name: "spreadsheetEndpoints",
			action: "payload.endpoints.spreadsheet",
		});

		if (error instanceof APIError) {
			throw error;
		}

		throw new APIError(
			"Failed to process spreadsheet request",
			500,
			{
				name: "spreadsheetEndpoints",
				action: "endpoints",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			true
		);
	}
};

/**
 * 스프레드시트 생성/동기화 처리 (GET)
 */
async function handleSpreadsheetRequest(request: PayloadRequest) {
	// 인증 확인
	const result = await request.payload.auth({
		headers: request.headers,
	});

	if (!result.user) {
		throw new APIError("Unauthorized", 401, {
			name: "handleSpreadsheetRequest",
			action: "endpoints",
		});
	}

	// 쿼리 파라미터 확인
	const url = new URL(request.url || "");
	const format = url.searchParams.get("format") || "both"; // excel, google, both
	const type = url.searchParams.get("type") || "forms"; // forms, clubForms
	const limit = Number.parseInt(url.searchParams.get("limit") || "100", 10);
	const download = url.searchParams.get("download") === "true";

	// 타입에 따라 다른 데이터 처리
	if (type === "clubForms") {
		return await handleClubFormsRequest(request, format, limit, download);
	}

	// 기본: 수련회 신청 목록 처리
	return await handleFormsRequest(request, format, limit, download);
}

/**
 * 수련회 신청 목록 처리
 */
async function handleFormsRequest(
	request: PayloadRequest,
	format: string,
	limit: number,
	download: boolean
) {
	// 데이터 조회
	const { docs } = await request.payload.find({
		collection: "forms",
		limit,
		req: request,
		sort: "-createdAt",
	});

	// 데이터를 RowFormData 형식으로 변환
	const formData = docs.map((doc) => DataConverter.toRowFormData(doc));

	const fileName = "청년부_연합_여름_수련회_참가자_명단";
	const spreadsheet = createSpreadsheet().withData(formData);

	// 요청한 형식에 따라 처리
	return await processSpreadsheetByFormat(
		request,
		format,
		download,
		fileName,
		"참가자명단",
		formData,
		spreadsheet
	);
}

/**
 * 동아리 신청 목록 처리
 */
async function handleClubFormsRequest(
	request: PayloadRequest,
	format: string,
	limit: number,
	download: boolean
) {
	// 동아리 신청서 데이터 조회 (relation 포함)
	const { docs } = await request.payload.find({
		collection: "clubForms",
		limit,
		req: request,
		sort: "-createdAt",
		depth: 2, // relation된 club 정보도 함께 조회
	});

	if (docs.length === 0) {
		return Response.json({
			success: false,
			message: "내보낼 동아리 신청서가 없습니다.",
			recordCount: 0,
		});
	}

	// 모든 동아리의 컴포넌트를 수집하여 통합 헤더 생성
	const allComponents = new Map<
		string,
		{
			id: string;
			title: string;
			type?: string;
			data?: Record<string, unknown>; // options 대신 data 사용
			clubTitle?: string; // 어떤 동아리의 컴포넌트인지 표시
		}
	>();

	for (const doc of docs) {
		const clubDoc = doc as ClubFormDoc;
		if (clubDoc.club?.components) {
			for (const component of clubDoc.club.components) {
				const key = `${clubDoc.club?.title}_${component.title}`;
				if (!allComponents.has(key)) {
					allComponents.set(key, {
						...component,
						clubTitle: clubDoc.club?.title,
					});
				}
			}
		}
	}

	// 동아리 신청서 데이터를 Excel용 형식으로 변환
	const clubFormData: ClubFormExcelData[] = docs.map((doc) => {
		const clubDoc = doc as ClubFormDoc;

		// 기본 정보
		const baseData = {
			이름: clubDoc.name || "",
			전화번호: clubDoc.phone || "",
			부서: clubDoc.department || "",
			또래: clubDoc.ageGroup || "",
			동아리: clubDoc.club?.title || "",
			신청일시: new Date(clubDoc.createdAt).toLocaleString("ko-KR"),
		};

		// 모든 컴포넌트에 대해 값 추가 (해당 동아리가 아닌 경우 빈 값)
		const dynamicData: Record<string, string> = {};
		allComponents.forEach((component, key) => {
			if (component.clubTitle === clubDoc.club?.title) {
				// 해당 동아리의 컴포넌트인 경우 실제 값 추가
				const value = clubDoc.data?.[`component_${component.id}`];
				dynamicData[component.title] = formatComponentValue(value, component);
			} else {
				// 다른 동아리의 컴포넌트인 경우 빈 값
				dynamicData[component.title] = "";
			}
		});

		return {
			...baseData,
			...dynamicData,
		};
	});

	const fileName = "동아리_신청자_목록";

	// 동아리 신청서용 커스텀 Excel 생성
	return await processClubFormExcel(
		request,
		format,
		download,
		fileName,
		clubFormData
	);
}

/**
 * 컴포넌트 값을 Excel용 문자열로 포맷
 */
function formatComponentValue(
	value: unknown,
	component: {
		type?: string;
		data?: Record<string, unknown>; // options 대신 data 사용
	}
): string {
	if (value === undefined || value === null) {
		return "";
	}

	if (
		(component.type === "select" || component.type === "radio") &&
		component.data
	) {
		// data 필드에서 data 배열 추출
		const options = component.data.data as
			| Array<{
					id: number;
					name: string;
					value?: string | boolean | number;
			  }>
			| undefined;

		if (options && Array.isArray(options)) {
			// 선택형 필드(select, radio)의 경우 value를 name으로 변환
			if (Array.isArray(value)) {
				return value
					.map((v) => {
						// id로 먼저 찾아보고, 없으면 value로 찾기
						const option = options.find(
							(opt) => opt.id === v || opt.value === v
						);
						return option?.name || v;
					})
					.join(", ");
			}
			// id로 먼저 찾아보고, 없으면 value로 찾기
			const option = options.find(
				(opt) => opt.id === value || opt.value === value
			);
			return option?.name || String(value);
		}
	}

	if (component.type === "checkbox") {
		// 체크박스의 경우 true/false를 한국어로 변환
		return value === true ? "예" : value === false ? "아니오" : String(value);
	}

	if (Array.isArray(value)) {
		// 배열인 경우 콤마로 구분된 문자열로 변환
		return value.join(", ");
	}

	return String(value);
}

/**
 * 동적 필드를 Excel용으로 변환 (모든 컴포넌트 표시)
 */
function extractDynamicFieldsForExcel(
	data: Record<string, unknown>,
	components: Array<{
		id: string;
		title: string;
		type?: string;
		data?: Record<string, unknown>; // options 대신 data 사용
	}>
): Record<string, string> {
	const result: Record<string, string> = {};

	// 모든 컴포넌트를 순회하여 Excel 열로 추가
	for (const component of components) {
		console.log("Processing component:", component);
		const value = data[`component_${component.id}`];

		// 값이 있는 경우 타입에 따른 처리
		if (value !== undefined && value !== null) {
			if (
				(component.type === "select" || component.type === "radio") &&
				component.data
			) {
				// data 필드에서 data 배열 추출
				const options = component.data.data as
					| Array<{
							id: number;
							name: string;
							value?: string | boolean | number;
					  }>
					| undefined;

				if (options && Array.isArray(options)) {
					// 선택형 필드(select, radio)의 경우 value를 name으로 변환
					if (Array.isArray(value)) {
						result[component.title] = value
							.map((v) => {
								// id로 먼저 찾아보고, 없으면 value로 찾기
								const option = options.find(
									(opt) => opt.id === v || opt.value === v
								);
								return option?.name || v;
							})
							.join(", ");
					} else {
						// id로 먼저 찾아보고, 없으면 value로 찾기
						const option = options.find(
							(opt) => opt.id === value || opt.value === value
						);
						result[component.title] = option?.name || String(value);
					}
				} else {
					result[component.title] = String(value);
				}
			} else if (component.type === "checkbox") {
				// 체크박스의 경우 true/false를 한국어로 변환
				result[component.title] =
					value === true ? "예" : value === false ? "아니오" : String(value);
			} else if (Array.isArray(value)) {
				// 배열인 경우 콤마로 구분된 문자열로 변환
				result[component.title] = value.join(", ");
			} else {
				result[component.title] = String(value);
			}
		} else {
			// 값이 없는 경우에도 컴포넌트 열은 표시 (빈 값으로)
			result[component.title] = "";
		}
	}

	return result;
}

/**
 * 스프레드시트 형식별 처리 공통 함수
 */
async function processSpreadsheetByFormat(
	request: PayloadRequest,
	format: string,
	download: boolean,
	fileName: string,
	sheetName: string,
	formData: RowFormData[],
	spreadsheet: SpreadsheetBuilder
) {
	// 요청한 형식에 따라 처리
	switch (format) {
		case "excel":
			if (download) {
				// Excel 파일 다운로드
				const { excel } = await spreadsheet
					.withExcel(`${fileName}.xlsx`, sheetName, true)
					.execute();

				if (!excel) {
					throw new APIError("Failed to generate Excel file", 500);
				}

				const arrayBufferLike = new Uint8Array(excel.buffer);
				const encodedName = encodeURIComponent(`${fileName}.xlsx`);

				return new Response(arrayBufferLike, {
					headers: headersWithCors({
						headers: new Headers({
							"Content-Type":
								"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
							"Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
						}),
						req: request,
					}),
				});
			}

			// Excel 생성만 (응답으로 상태 반환)
			await spreadsheet
				.withExcel(`${fileName}.xlsx`, sheetName, true)
				.execute();

			return Response.json({
				success: true,
				message: "Excel file generated successfully",
				format: "excel",
				recordCount: formData.length,
			});

		case "google":
			// Google Sheets 동기화
			await spreadsheet
				.withGoogleSheetsFromEnv(env.GOOGLE_SHEET_TITLE)
				.execute();

			return Response.json({
				success: true,
				message: "Google Sheets synchronized successfully",
				format: "google",
				recordCount: formData.length,
				sheetUrl: `https://docs.google.com/spreadsheets/d/${env.GOOGLE_SHEET_ID}`,
			});

		default:
			if (download) {
				// Excel 파일 다운로드 + Google Sheets 동기화
				const { excel } = await spreadsheet
					.withExcel(`${fileName}.xlsx`, sheetName, true)
					.withGoogleSheetsFromEnv(env.GOOGLE_SHEET_TITLE)
					.execute();

				if (!excel) {
					throw new APIError("Failed to generate Excel file", 500);
				}

				const arrayBufferLike = new Uint8Array(excel.buffer);
				const encodedName = encodeURIComponent(`${fileName}.xlsx`);

				return new Response(arrayBufferLike, {
					headers: headersWithCors({
						headers: new Headers({
							"Content-Type":
								"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
							"Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
							"X-Google-Sheets-Synced": "true",
							"X-Google-Sheets-Url": `https://docs.google.com/spreadsheets/d/${env.GOOGLE_SHEET_ID}`,
						}),
						req: request,
					}),
				});
			}

			// Excel과 Google Sheets 모두 처리 (응답으로 상태 반환)
			await spreadsheet
				.withExcel(`${fileName}.xlsx`, sheetName, true)
				.withGoogleSheetsFromEnv(env.GOOGLE_SHEET_TITLE)
				.execute();

			return Response.json({
				success: true,
				message: "Excel and Google Sheets processed successfully",
				format: "both",
				recordCount: formData.length,
				sheetUrl: `https://docs.google.com/spreadsheets/d/${env.GOOGLE_SHEET_ID}`,
			});
	}
}

/**
 * Google Sheets 웹훅 처리 (POST)
 */
async function handleWebhook(request: PayloadRequest) {
	// @ts-expect-error request.json() type issue
	const data: WebhookBody = await request.json();

	// 웹훅 데이터 처리
	const { key, parsedValue } = SpreadsheetWebhookUtils.processWebhookData(data);

	// 데이터베이스 업데이트
	await request.payload.update({
		collection: "forms",
		id: data.id,
		data: { [key]: parsedValue },
		req: request,
	});

	// 전체 데이터 조회
	const { docs } = await request.payload.find({
		collection: "forms",
		limit: 100,
		req: request,
		sort: "-createdAt",
	});

	// Google Sheets 동기화 매니저 생성
	const syncManager = new GoogleSheetsSyncManager();

	// 데이터를 RowFormData 형식으로 변환
	const formData = docs.map((doc) => DataConverter.toRowFormData(doc));

	// Google Sheets에 동기화
	await syncManager.setDocs(formData).syncToGoogleSheets();

	return Response.json({
		success: true,
		message: `Successfully synced Google Sheet for header "${data.header}"`,
		recordCount: formData.length,
	});
}

/**
 * 동아리 신청서용 Excel 처리
 */
async function processClubFormExcel(
	request: PayloadRequest,
	format: string,
	download: boolean,
	fileName: string,
	clubFormData: ClubFormExcelData[]
) {
	const { ExcelManager } = await import("@jwc/spreadsheet");

	try {
		// Excel 매니저 인스턴스 생성
		const excelManager = new ExcelManager();

		// 워크북 생성
		const workbook = excelManager.createWorkbook();

		// 워크시트 생성
		const worksheet = excelManager.createSheet(workbook, "동아리신청자");

		// 헤더 추출 (첫 번째 데이터 객체의 키들)
		const headers =
			clubFormData.length > 0 && clubFormData[0]
				? Object.keys(clubFormData[0])
				: [];

		// 헤더 행 추가
		const headerRow = worksheet.addRow(headers);
		headerRow.height = 25;

		// 헤더 스타일 적용
		headerRow.eachCell((cell, colNum) => {
			excelManager.styleManager.styleHeaderCell(cell);
			worksheet.getColumn(colNum).width = 15;
		});

		// 데이터 행 추가
		for (const row of clubFormData) {
			const rowValues = headers.map((header) => row[header] || "");
			const dataRow = worksheet.addRow(rowValues);

			dataRow.eachCell((cell) => {
				excelManager.styleManager.styleDataCell(cell);
			});
		}

		// 자동 필터 적용
		if (clubFormData.length > 0) {
			worksheet.autoFilter = {
				from: { row: 1, column: 1 },
				to: { row: clubFormData.length + 1, column: headers.length },
			};
		}

		if (format === "excel" && download) {
			// Excel 파일 다운로드
			const buffer = await excelManager.writeToBuffer(workbook);
			const arrayBufferLike = new Uint8Array(buffer);
			const encodedName = encodeURIComponent(`${fileName}.xlsx`);

			return new Response(arrayBufferLike, {
				headers: headersWithCors({
					headers: new Headers({
						"Content-Type":
							"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
						"Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
					}),
					req: request,
				}),
			});
		}

		return Response.json({
			success: true,
			message: "동아리 신청서 Excel 파일이 성공적으로 생성되었습니다",
			format: "excel",
			recordCount: clubFormData.length,
		});
	} catch (error) {
		log.error("endpoints", error as Error, {
			name: "processClubFormExcel",
			action: "generate club form excel",
		});

		throw new APIError("Failed to generate club form Excel file", 500);
	}
}
