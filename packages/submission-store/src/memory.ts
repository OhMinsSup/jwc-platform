import { SubmissionStoreError } from "./port";
import type {
	StoredSubmission,
	SubmissionStore,
	SubmissionWrite,
} from "./port";

/**
 * 메모리 어댑터: 테스트와 계약의 기준 구현. 워커 isolate마다 따로 생기므로 운영 저장소로 쓰지 않는다.
 * 레코드는 복사해서 보관/반환한다(호출자가 고쳐도 저장값이 바뀌지 않게 — 실제 DB와 같은 값 의미).
 */
type Collections = Map<string, Map<string, StoredSubmission>>;

function collectionOf(
	collections: Collections,
	name: string,
): Map<string, StoredSubmission> {
	let records = collections.get(name);
	if (!records) {
		records = new Map();
		collections.set(name, records);
	}
	return records;
}

function putRecord(
	collections: Collections,
	name: string,
	record: SubmissionWrite,
): void {
	const records = collectionOf(collections, name);
	const previous = records.get(record.id);
	records.set(record.id, {
		id: record.id,
		answers: structuredClone(record.answers),
		paid: record.paid ?? previous?.paid ?? false,
		issues: {},
	});
}

export function createMemorySubmissionStore(): SubmissionStore {
	const collections: Collections = new Map();

	return {
		prepare: (target) => {
			collectionOf(collections, target.collection);
			return Promise.resolve();
		},
		get: (target, id) => {
			const record = collections.get(target.collection)?.get(id);
			return Promise.resolve(record ? structuredClone(record) : null);
		},
		list: (target) => {
			const records = collections.get(target.collection);
			return Promise.resolve(
				records ? [...records.values()].map((r) => structuredClone(r)) : [],
			);
		},
		put: (target, record) => {
			putRecord(collections, target.collection, record);
			return Promise.resolve();
		},
		setPaid: (target, id, paid) => {
			const record = collections.get(target.collection)?.get(id);
			if (!record) {
				return Promise.reject(
					new SubmissionStoreError("not_found", "응답을 찾을 수 없습니다"),
				);
			}
			record.paid = paid;
			return Promise.resolve();
		},
	};
}
