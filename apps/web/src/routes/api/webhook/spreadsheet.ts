import { api } from "@jwc/backend/convex/_generated/api";
import type { Id } from "@jwc/backend/convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { ConvexHttpClient } from "convex/browser";

/** 스프레드시트 웹훅 페이로드 타입 */
interface SpreadsheetWebhookPayload {
	eventType: "EDIT";
	spreadsheetId: string;
	sheetName: string;
	range: string;
	row: number;
	column: number;
	header: string;
	id: string;
	oldValue?: string;
	newValue?: string;
	timestamp: string;
}

/** 환경변수 가져오기 */
function getEnvVars() {
	const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
	const WEBHOOK_SECRET = import.meta.env.SPREADSHEET_WEBHOOK_SECRET;
	const SHEET_ID = import.meta.env.GOOGLE_SPREADSHEET_ID;

	if (!CONVEX_URL) {
		throw new Error("VITE_CONVEX_URL is not configured");
	}

	return { CONVEX_URL, WEBHOOK_SECRET, SHEET_ID };
}

export const Route = createFileRoute("/api/webhook/spreadsheet")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const { CONVEX_URL, WEBHOOK_SECRET, SHEET_ID } = getEnvVars();

					// 웹훅 시크릿 검증 (선택적)
					const authHeader = request.headers.get("x-webhook-secret");
					if (WEBHOOK_SECRET && authHeader !== WEBHOOK_SECRET) {
						console.error("[Webhook] Invalid webhook secret");
						return json(
							{ success: false, error: "Unauthorized" },
							{ status: 401 }
						);
					}

					const payload: SpreadsheetWebhookPayload = await request.json();
					console.log("[Webhook] Received:", JSON.stringify(payload, null, 2));

					// 이벤트 타입 검증
					if (payload.eventType !== "EDIT") {
						return json(
							{ success: false, error: "Unsupported event type" },
							{ status: 400 }
						);
					}

					// 스프레드시트 ID 검증 (선택적)
					if (SHEET_ID && payload.spreadsheetId !== SHEET_ID) {
						console.error("[Webhook] Invalid spreadsheet ID");
						return json(
							{ success: false, error: "Invalid spreadsheet" },
							{ status: 400 }
						);
					}

					// ID 필수 검증
					if (!payload.id) {
						console.error("[Webhook] Missing ID in payload");
						return json(
							{ success: false, error: "Missing ID" },
							{ status: 400 }
						);
					}

					// 수정 불가 필드 체크 (ID, 신청일시, 이름, 연락처 등)
					const readOnlyFields = ["ID", "신청일시", "연락처"];
					if (readOnlyFields.includes(payload.header)) {
						console.log(`[Webhook] Read-only field: ${payload.header}`);
						return json({
							success: true,
							message: "Read-only field, skipped",
						});
					}

					// 서버 사이드에서는 ConvexHttpClient 사용
					const client = new ConvexHttpClient(CONVEX_URL);

					const nextValue = payload.newValue ?? "";

					const result = await client.mutation(
						api.onboarding.updateFieldFromSpreadsheet,
						{
							id: payload.id as Id<"onboarding">,
							field: payload.header,
							value: nextValue,
						}
					);

					console.log("[Webhook] Update result:", result);

					return json({ success: true, result });
				} catch (error) {
					console.error("[Webhook] Error:", error);
					const message =
						error instanceof Error ? error.message : "Unknown error";
					return json({ success: false, error: message }, { status: 500 });
				}
			},
		},
	},
});
