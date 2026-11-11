import type { Answers } from "@jwc/form-core/answers/value";
import type { FormDefinition } from "@jwc/form-core/definition/definition";

/**
 * 응답 저장소 포트. 응답 본문(답변)과 납입 여부의 원본은 이 저장소다.
 *
 * 서비스는 이 인터페이스에만 의존한다. 저장소를 바꿀 때(예: Postgres)는 어댑터 하나를 추가하고
 * test/store-contract.ts의 계약 테스트를 통과시키면 된다.
 *
 * 저장소가 보장하지 않는 것(원자적 유니크 판정, 같은 응답의 동시 쓰기 직렬화)은 D1 submission_keys가 맡는다.
 */

/** 저장소 안의 폼 단위 공간. Google Sheets에서는 탭 1개 */
export interface StoreTarget {
	/** 공간 이름 (forms.sheetName) */
	collection: string;
	/** 레코드 ↔ 저장 형식 변환에 쓰는 정의 */
	definition: FormDefinition;
}

/** 저장할 레코드 */
export interface SubmissionWrite {
	answers: Answers;
	id: string;
	/** undefined면 기존 값을 보존한다 (재제출이 운영자가 바꾼 납입 여부를 덮어쓰지 않게) */
	paid?: boolean;
	submittedAt: number;
}

/** 저장소에서 읽은 레코드 */
export interface StoredSubmission {
	answers: Answers;
	id: string;
	/** 해석하지 못한 값: 헤더(필드 이름) → 이유. 운영자가 시트를 잘못 고친 경우 */
	issues: Record<string, string>;
	paid: boolean;
}

export interface SubmissionStore {
	/** 폼 공간을 준비한다 (없으면 만들고, 새 질문 컬럼을 추가). 발행 시 호출 */
	prepare: (target: StoreTarget) => Promise<void>;
	/** id로 1건. 없으면 null */
	get: (target: StoreTarget, id: string) => Promise<StoredSubmission | null>;
	/** 폼의 전체 레코드 (저장 순서) */
	list: (target: StoreTarget) => Promise<StoredSubmission[]>;
	/** id 기준 upsert. 재시도해도 중복 레코드를 만들지 않는다 */
	put: (target: StoreTarget, record: SubmissionWrite) => Promise<void>;
	/** 납입 여부만 바꾼다. 레코드가 없으면 SubmissionStoreError("not_found") */
	setPaid: (target: StoreTarget, id: string, paid: boolean) => Promise<void>;
}

/**
 * 어댑터가 공급자 오류(HTTP, 권한, 형식)를 이 분류로 바꿔 던진다. 서비스는 공급자 오류 타입을 모른다.
 * - unavailable: 일시 장애/할당량 (재시도 가치 있음)
 * - forbidden: 권한/인증 설정 문제 (운영자 조치 필요)
 * - layout: 저장 공간 구조가 깨짐 (예: 시트의 응답 ID 컬럼 삭제)
 * - not_found: 대상 레코드 없음
 */
export type StoreFailure = "unavailable" | "forbidden" | "layout" | "not_found";

export class SubmissionStoreError extends Error {
	override name = "SubmissionStoreError";
	readonly failure: StoreFailure;
	constructor(failure: StoreFailure, message: string, options?: ErrorOptions) {
		super(message, options);
		this.failure = failure;
	}
	get retryable(): boolean {
		return this.failure === "unavailable";
	}
}
