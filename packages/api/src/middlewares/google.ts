import { os } from "@orpc/server";
import { JWT } from "google-auth-library";
import {
	GoogleSpreadsheet,
	type GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { env } from "../env";
import type { ORPCCOntextType } from "../orpc";

const SHEET_ID = "1478n2JXYrutxmbAcopQruCBTAa3Fzm3kWhH1YWqDYfE";

const SHEET_NAME = "수련회 신청서 목록";

export const createFormSheetHeaders = () => {
	return [
		{ name: "타임스탬프", key: "timestamp" },
		{ name: "이름", key: "name" },
		{ name: "연락처", key: "phone" },
		{ name: "성별", key: "gender" },
		{ name: "부서", key: "department" },
		{ name: "또래", key: "ageGroup" },
		{ name: "지원하고 싶은 TF팀", key: "tfTeam" },
		{ name: "참석하고 싶은 수련회 일정", key: "numberOfStays" },
		{ name: "픽업 상세내용", key: "pickupTimeDesc" },
		{ name: "차량 지원 여부", key: "carSupport" },
		{ name: "차량 지원 상세내용", key: "carSupportContent" },
		{ name: "회비 납부", key: "isPaid" },
		{ name: "티셔츠 사이즈", key: "tshirtSize" },
	];
};

export type GoogleMiddlewareContext = ORPCCOntextType & {
	doc?: GoogleSpreadsheet;
	sheet?: GoogleSpreadsheetWorksheet;
};

export const $google = os
	.$context<GoogleMiddlewareContext>()
	.middleware(async ({ context, next }) => {
		if (context.doc) {
			return next({
				context: {
					doc: context.doc,
					sheet: context.sheet,
				},
			});
		}

		const serviceAccountAuth = new JWT({
			email: env.GOOGLE_CLIENT_EMAIL,
			key: env.GOOGLE_PRIVATE_KEY,
			scopes: ["https://www.googleapis.com/auth/spreadsheets"],
		});

		const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);

		await doc.updateProperties({
			title: "수련회 신청서",
			timeZone: "Asia/Seoul",
			locale: "ko_KR",
		});

		const sheet = doc.sheetsByTitle[SHEET_NAME]
			? doc.sheetsByTitle[SHEET_NAME]
			: await doc.addSheet({
					title: SHEET_NAME,
					headerValues: createFormSheetHeaders().map((header) => header.name),
				});

		return next({
			context: {
				doc,
				sheet,
			},
		});
	});
