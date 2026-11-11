import type {
	StoredSubmission,
	StoreTarget,
	SubmissionStore,
	SubmissionWrite,
} from "./port";

/**
 * 한 폼의 공간(StoreTarget)에 묶인 저장소. 서비스가 매 호출마다 공간을 다시 조립하지 않게 한다.
 * 어떤 어댑터든 같은 방식으로 묶는다 (저장소 종류와 무관).
 */
export interface BoundSubmissionStore {
	get: (id: string) => Promise<StoredSubmission | null>;
	list: () => Promise<StoredSubmission[]>;
	prepare: () => Promise<void>;
	put: (record: SubmissionWrite) => Promise<void>;
	setPaid: (id: string, paid: boolean) => Promise<void>;
}

export function bindSubmissionStore(
	store: SubmissionStore,
	target: StoreTarget,
): BoundSubmissionStore {
	return {
		prepare: () => store.prepare(target),
		get: (id) => store.get(target, id),
		list: () => store.list(target),
		put: (record) => store.put(target, record),
		setPaid: (id, paid) => store.setPaid(target, id, paid),
	};
}
