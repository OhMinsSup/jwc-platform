import { classifyError } from "../../../platform/server/errors/classify";
import { log } from "../../../platform/server/log";
import { listAudit, recordAudit } from "./audit-log-repository";
import type { AuditEntry, AuditListRow } from "./audit-log-repository";

/**
 * 관리자 작업 감사 기록. 서버 함수가 작업 성공 뒤에 부른다 (서비스는 자기 일만 한다).
 */

const RECENT_AUDIT = 50;

/**
 * 작업은 이미 커밋되었으므로 기록 실패가 작업 응답을 실패로 바꾸지 않게 한다
 * (실패로 보이면 운영자가 같은 작업을 다시 시도해 중복이 생긴다). 실패는 error 로그로 남긴다.
 */
async function recordAdminAction(entry: AuditEntry): Promise<void> {
	try {
		await recordAudit(entry);
	} catch (error) {
		const failure = classifyError(error);
		log.error("audit.record_failed", {
			action: entry.action,
			code: failure.code,
			error: failure.internalMessage,
		});
	}
}

export function recentAdminActions(): Promise<AuditListRow[]> {
	return listAudit(RECENT_AUDIT);
}

/** 감사 기록 한 줄의 내용 (작업 결과로부터 만든다). 행위자/시각은 audited가 채운다 */
export type AuditOf<T> = (result: T) => Omit<AuditEntry, "actorId" | "now">;

/**
 * 작업을 실행하고, 성공하면 그 결과로 감사 기록을 남긴다.
 * 서버 함수마다 반복하던 기록 코드를 "무엇을 남길지"(AuditOf, 데이터)만 선언하게 바꾼다.
 */
export async function audited<T>(
	actor: { id: string },
	entry: AuditOf<T>,
	run: () => Promise<T>,
): Promise<T> {
	const result = await run();
	await recordAdminAction({
		...entry(result),
		actorId: actor.id,
		now: Date.now(),
	});
	return result;
}
