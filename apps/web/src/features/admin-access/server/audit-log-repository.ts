import { randomId } from "@jwc/common/encoding";
import { currentRequestId } from "@jwc/observability/scope";
import { auditLog, user } from "@schema";
import { db, desc, eq } from "void/db";

import type { AuditAction } from "../model/admin-access";

/**
 * 관리자 작업 감사 기록(D1). detail에는 id/버전/상태/불리언 같은 원시값만 넣는다 (개인정보 금지).
 */

type AuditDetail = Record<string, string | number | boolean | null>;

export interface AuditEntry {
	action: AuditAction;
	actorId: string;
	detail?: AuditDetail;
	now: number;
	targetId: string;
	targetType: "form" | "submission" | "invite" | "user";
}

export interface AuditListRow {
	action: string;
	actorId: string;
	/** 작업한 관리자 이름 (계정이 지워졌으면 null) */
	actorName: string | null;
	at: number;
	id: string;
	targetId: string;
	targetType: string;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
	await db.insert(auditLog).values({
		id: randomId(),
		actorId: entry.actorId,
		action: entry.action,
		targetType: entry.targetType,
		targetId: entry.targetId,
		detail: entry.detail ?? null,
		requestId: currentRequestId() ?? null,
		at: entry.now,
	});
}

export async function listAudit(limit: number): Promise<AuditListRow[]> {
	return await db
		.select({
			id: auditLog.id,
			actorId: auditLog.actorId,
			actorName: user.name,
			action: auditLog.action,
			targetType: auditLog.targetType,
			targetId: auditLog.targetId,
			at: auditLog.at,
		})
		.from(auditLog)
		.leftJoin(user, eq(user.id, auditLog.actorId))
		.orderBy(desc(auditLog.at))
		.limit(limit);
}
