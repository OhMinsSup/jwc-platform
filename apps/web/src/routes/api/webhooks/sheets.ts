import { createFileRoute } from "@tanstack/react-router";

import { DomainError } from "../../../server/errors";
import { errorMessage, log } from "../../../server/log";
import { sheetsWebhookSecret } from "../../../server/runtime";
import {
	applySheetEdit,
	SheetEditSchema,
} from "../../../server/services/webhook";
import { verifyWebhookSignature } from "../../../server/webhook-signature";

const MAX_BODY_BYTES = 16_384;

function json(status: number, body: Record<string, unknown>): Response {
	return Response.json(body, { status });
}

/**
 * Google Apps Script onEdit → 시트 셀 수정 통지.
 * 서명(HMAC + 타임스탬프) 검증 후에만 본문을 해석한다. 시크릿/본문 값은 로그에 남기지 않는다.
 */
async function handle(request: Request): Promise<Response> {
	const rawBody = await request.text();
	if (rawBody.length > MAX_BODY_BYTES) {
		return json(413, { ok: false, error: "본문이 너무 큽니다" });
	}
	const verified = await verifyWebhookSignature(
		sheetsWebhookSecret(),
		{
			timestamp: request.headers.get("x-jwc-timestamp"),
			signature: request.headers.get("x-jwc-signature"),
		},
		rawBody,
		Date.now(),
	);
	if (!verified) {
		log.warn("webhook.rejected_signature");
		return json(401, { ok: false, error: "서명이 올바르지 않습니다" });
	}
	let body: unknown;
	try {
		body = JSON.parse(rawBody);
	} catch {
		return json(400, { ok: false, error: "JSON 형식이 아닙니다" });
	}
	const parsed = SheetEditSchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { ok: false, error: "페이로드 형식이 올바르지 않습니다" });
	}
	try {
		const result = await applySheetEdit(parsed.data, Date.now());
		log.info("webhook.applied", {
			sheetName: parsed.data.sheetName,
			header: parsed.data.header,
			applied: result.applied,
		});
		return json(200, { ok: true, ...result });
	} catch (error) {
		if (error instanceof DomainError) {
			return json(error.status, { ok: false, error: error.message });
		}
		log.error("webhook.failed", { error: errorMessage(error) });
		return json(500, { ok: false, error: "처리 중 오류" });
	}
}

export const Route = createFileRoute("/api/webhooks/sheets")({
	server: { handlers: { POST: ({ request }) => handle(request) } },
});
