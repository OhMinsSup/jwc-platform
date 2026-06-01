"use node";

/**
 * Google Sheets 동기화 액션
 *
 * Node.js 런타임에서 실행됨
 * - Workpool을 통한 비동기 동기화
 * - 신청서 데이터를 Google Sheets에 동기화
 */

import { defineSchema, syncToGoogleSheets } from "@jwc/spreadsheet";
import type { EncryptedData } from "@jwc/utils/crypto";
import { decrypt, deriveKey } from "@jwc/utils/crypto";
import { dayjs } from "@jwc/utils/date";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import {
	DEPARTMENT_LABELS,
	GENDER_LABELS,
	STAY_TYPE_LABELS,
	TF_TEAM_LABELS,
	TSHIRT_SIZE_LABELS,
} from "./lib/constants";

/** 스프레드시트 행 데이터 타입 */
interface SpreadsheetRow {
	id: string;
	createdAt: string;
	name: string;
	phone: string;
	gender: string;
	department: string;
	ageGroup: string;
	stayType: string;
	attendanceDateOnly: string;
	attendanceTime: string;
	pickupTimeDescription: string;
	isPaid: string;
	tfTeam: string;
	canProvideRide: string;
	rideDetails: string;
	tshirtSize: string;
}

/**
 * 복호화된 개인정보와 온보딩 데이터를 스프레드시트 행으로 변환
 */
function transformToSpreadsheetRow(
	onboarding: Doc<"onboarding">,
	decryptedInfo: { name: string; phone: string }
): SpreadsheetRow {
	// 옵션값 변환 (스키마에 정의된 옵션과 일치해야 함)
	const gender = GENDER_LABELS[onboarding.gender] ?? "남성";
	const department = DEPARTMENT_LABELS[onboarding.department] ?? "기타";
	const stayType =
		STAY_TYPE_LABELS[onboarding.stayType] ?? "3박4일 (전체 참석)";
	const tfTeam = onboarding.tfTeam
		? (TF_TEAM_LABELS[onboarding.tfTeam] ?? "없음")
		: "없음";
	const tshirtSize = onboarding.tshirtSize
		? (TSHIRT_SIZE_LABELS[onboarding.tshirtSize] ?? "")
		: "";

	const createdAt = onboarding._creationTime
		? dayjs(onboarding._creationTime)
				.tz("Asia/Seoul")
				.format("YYYY년 MM월 DD일 (ddd) HH:mm")
		: "";

	const _attendanceDate = onboarding.attendanceDate;
	const attendanceDateOnly = _attendanceDate
		? dayjs(_attendanceDate).format("YYYY년 MM월 DD일")
		: "";
	const attendanceTime = _attendanceDate
		? dayjs(_attendanceDate).format("A hh:mm")
		: "";

	return {
		id: onboarding._id,
		createdAt,
		name: decryptedInfo.name,
		phone: decryptedInfo.phone,
		gender,
		department,
		ageGroup: onboarding.ageGroup,
		stayType,
		attendanceDateOnly,
		attendanceTime,
		pickupTimeDescription: onboarding.pickupTimeDescription ?? "",
		isPaid: onboarding.isPaid ? "납입" : "미납",
		tfTeam,
		canProvideRide: onboarding.canProvideRide ? "가능" : "불가",
		rideDetails: onboarding.rideDetails ?? "",
		tshirtSize,
	};
}

/**
 * 신청서를 복호화하고 스프레드시트 행으로 변환
 */
async function decryptAndTransformOnboarding(
	onboarding: Doc<"onboarding">,
	key: Awaited<ReturnType<typeof deriveKey>>
): Promise<SpreadsheetRow | null> {
	try {
		const phone = await decrypt(
			onboarding.phone as unknown as EncryptedData,
			key
		);
		const decryptedInfo = {
			name: onboarding.name,
			phone,
		};
		return transformToSpreadsheetRow(onboarding, decryptedInfo);
	} catch (error) {
		console.error(
			`[Spreadsheet] Failed to decrypt onboarding ${onboarding._id}:`,
			error
		);
		return null;
	}
}

/** 동기화 결과 타입 */
interface SyncResult {
	success: boolean;
	rowCount: number;
	sheetId?: number;
	error?: string;
}

/**
 * 모든 신청서를 Google Sheets에 동기화하는 액션
 * - 모든 신청서 데이터를 조회
 * - 개인정보 복호화
 * - Google Sheets에 동기화
 */
export const syncAllToGoogleSheets = internalAction({
	args: {},
	handler: async (ctx): Promise<SyncResult> => {
		const AES_KEY = process.env.AES_KEY;
		if (!AES_KEY) {
			throw new Error("AES_KEY is not configured in environment variables");
		}

		// 모든 신청서 조회
		const allOnboardings: Doc<"onboarding">[] = await ctx.runQuery(
			internal.onboarding.getAllInternal
		);

		if (allOnboardings.length === 0) {
			console.log("[Spreadsheet] No data to sync");
			return { success: true, rowCount: 0 };
		}

		const key = await deriveKey(AES_KEY);

		// 복호화된 데이터 변환
		const rows: (SpreadsheetRow | null)[] = await Promise.all(
			allOnboardings.map((onboarding: Doc<"onboarding">) =>
				decryptAndTransformOnboarding(onboarding, key)
			)
		);

		console.log(
			`[Spreadsheet] Decryption completed: ${rows.filter((r) => r !== null).length} valid rows out of ${rows.length}`
		);
		console.log(rows);

		// 복호화 실패한 데이터 제외
		const validRows: SpreadsheetRow[] = rows.filter(
			(row): row is SpreadsheetRow => row !== null
		);

		if (validRows.length === 0) {
			console.log("[Spreadsheet] No valid data to sync after decryption");
			return {
				success: false,
				rowCount: 0,
				error: "Decryption failed for all rows",
			};
		}

		try {
			// 온보딩 스키마 정의
			const onboardingSchema = defineSchema<SpreadsheetRow>({
				name: "onboarding",
				defaultSheetName: "신청자목록",
				columns: [
					{
						key: "id",
						header: "ID",
						type: "text",
						width: 28,
					},
					{
						key: "createdAt",
						header: "신청일시",
						type: "text",
						width: 18,
					},
					{
						key: "name",
						header: "이름",
						type: "text",
						width: 10,
						required: true,
					},
					{
						key: "phone",
						header: "연락처",
						type: "text",
						width: 14,
					},
					{
						key: "gender",
						header: "성별",
						type: "dropdown",
						options: ["남성", "여성"],
						width: 8,
					},
					{
						key: "department",
						header: "소속",
						type: "dropdown",
						options: ["청년1부", "청년2부", "기타"],
						width: 10,
					},
					{
						key: "ageGroup",
						header: "연령대",
						type: "text",
						width: 10,
					},
					{
						key: "stayType",
						header: "숙박형태",
						type: "dropdown",
						options: [
							"3박4일 (전체 참석)",
							"2박3일",
							"1박2일",
							"무박 (당일치기)",
						],
						width: 16,
					},
					{
						key: "attendanceDateOnly",
						header: "참석일자",
						type: "dropdown",
						options: [
							"2026년 06월 25일",
							"2026년 06월 26일",
							"2026년 06월 27일",
							"2026년 06월 28일",
						],
						width: 15,
					},
					{
						key: "attendanceTime",
						header: "참석시간",
						type: "dropdown",
						options: [
							"오전 12:00",
							"오전 12:30",
							"오전 1:00",
							"오전 1:30",
							"오전 2:00",
							"오전 2:30",
							"오전 3:00",
							"오전 3:30",
							"오전 4:00",
							"오전 4:30",
							"오전 5:00",
							"오전 5:30",
							"오전 6:00",
							"오전 6:30",
							"오전 7:00",
							"오전 7:30",
							"오전 8:00",
							"오전 8:30",
							"오전 9:00",
							"오전 9:30",
							"오전 10:00",
							"오전 10:30",
							"오전 11:00",
							"오전 11:30",
							"오후 12:00",
							"오후 12:30",
							"오후 1:00",
							"오후 1:30",
							"오후 2:00",
							"오후 2:30",
							"오후 3:00",
							"오후 3:30",
							"오후 4:00",
							"오후 4:30",
							"오후 5:00",
							"오후 5:30",
							"오후 6:00",
							"오후 6:30",
							"오후 7:00",
							"오후 7:30",
							"오후 8:00",
							"오후 8:30",
							"오후 9:00",
							"오후 9:30",
							"오후 10:00",
							"오후 10:30",
							"오후 11:00",
							"오후 11:30",
						],
						width: 15,
					},
					{
						key: "pickupTimeDescription",
						header: "픽업시간",
						type: "text",
						width: 15,
					},
					{
						key: "isPaid",
						header: "납입여부",
						type: "dropdown",
						options: ["납입", "미납"],
						width: 8,
					},
					{
						key: "tfTeam",
						header: "TF팀",
						type: "dropdown",
						options: ["없음", "찬양팀", "프로그램팀", "미디어팀"],
						width: 12,
					},
					{
						key: "canProvideRide",
						header: "차량지원",
						type: "dropdown",
						options: ["가능", "불가"],
						width: 8,
					},
					{
						key: "rideDetails",
						header: "차량정보",
						type: "text",
						width: 20,
					},
					{
						key: "tshirtSize",
						header: "티셔츠",
						type: "dropdown",
						options: ["S", "M", "L", "XL", "2XL", "3XL"],
						width: 8,
					},
				],
			});

			const result: SyncResult = await syncToGoogleSheets(
				onboardingSchema,
				validRows
			);

			console.log(
				`[Spreadsheet] Sync completed: ${result.rowCount} rows, success: ${result.success}`
			);

			return result;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("[Spreadsheet] Sync failed:", error);
			return { success: false, rowCount: 0, error: errorMessage };
		}
	},
});
