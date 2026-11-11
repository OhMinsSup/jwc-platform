import { rejectionOf } from "@jwc/common/testing";
import { validateAnswers } from "@jwc/form-core/answers/validate";
import { parseFormDefinition } from "@jwc/form-core/definition/definition";
import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { retreat2026Definition } from "@jwc/form-core/samples/retreat-2026";
import { beforeEach, describe, expect, it } from "vite-plus/test";

import { SubmissionStoreError } from "./port";
import type { StoreTarget, SubmissionStore, SubmissionWrite } from "./port";

/**
 * SubmissionStore 계약. 모든 어댑터가 같은 시나리오를 통과해야 한다.
 * 새 저장소(예: Postgres)를 붙일 때 이 함수로 테스트를 하나 더 등록한다.
 */

const NOW = Date.UTC(2026, 4, 1, 3, 0, 0);

export function contractDefinition(): FormDefinition {
	const parsed = parseFormDefinition(retreat2026Definition);
	if (!parsed.ok) {
		throw new Error("fixture invalid");
	}
	return parsed.definition;
}

function write(
	id: string,
	overrides: Record<string, unknown> = {},
): SubmissionWrite {
	const validation = validateAnswers(contractDefinition(), {
		name: "홍길동",
		phone: "010-1234-5678",
		gender: "male",
		department: "youth1",
		age_group: "y95",
		stay_type: "full",
		tf_team: "none",
		can_ride: false,
		...overrides,
	});
	if (!validation.ok) {
		throw new Error(JSON.stringify(validation.errors));
	}
	return {
		id,
		submittedAt: NOW,
		paid: false,
		answers: validation.answers,
	};
}

export function describeSubmissionStoreContract(
	name: string,
	createStore: () => SubmissionStore,
): void {
	describe(`SubmissionStore 계약: ${name}`, () => {
		let store: SubmissionStore;
		let target: StoreTarget;
		beforeEach(() => {
			store = createStore();
			target = { collection: "retreat", definition: contractDefinition() };
		});

		it("준비 전에도 목록은 비어 있고 단건 조회는 null", async () => {
			await expect(store.list(target)).resolves.toStrictEqual([]);
			await expect(store.get(target, "s1")).resolves.toBeNull();
		});

		it("저장한 답변을 그대로 읽는다", async () => {
			await store.prepare(target);
			const record = write("s1");
			await store.put(target, record);
			const stored = await store.get(target, "s1");
			expect(stored?.answers).toStrictEqual(record.answers);
			expect(stored?.paid).toBe(false);
			expect(stored?.issues).toStrictEqual({});
		});

		it("같은 id로 다시 쓰면 갱신된다 (중복 레코드 없음)", async () => {
			await store.put(target, write("s1"));
			await store.put(target, write("s1", { name: "김철수" }));
			const all = await store.list(target);
			expect(all.map((record) => record.id)).toStrictEqual(["s1"]);
			expect(all[0]?.answers.name).toBe("김철수");
		});

		it("목록은 저장 순서", async () => {
			await store.put(target, write("s1"));
			await store.put(target, write("s2", { name: "김철수" }));
			const all = await store.list(target);
			const ids = all.map((record) => record.id);
			expect(ids).toStrictEqual(["s1", "s2"]);
		});

		it("paid를 생략한 재저장은 납입 여부를 보존한다", async () => {
			await store.put(target, write("s1"));
			await store.setPaid(target, "s1", true);
			await store.put(target, { ...write("s1"), paid: undefined });
			const stored = await store.get(target, "s1");
			expect(stored?.paid).toBe(true);
		});

		it("setPaid는 납입 여부만 바꾼다", async () => {
			const record = write("s1");
			await store.put(target, record);
			await store.setPaid(target, "s1", true);
			const stored = await store.get(target, "s1");
			expect(stored?.paid).toBe(true);
			expect(stored?.answers).toStrictEqual(record.answers);
		});

		it("없는 레코드의 setPaid는 not_found", async () => {
			await store.prepare(target);
			const error = await rejectionOf(
				store.setPaid(target, "nope", true),
				SubmissionStoreError,
			);
			expect(error.failure).toBe("not_found");
			expect(error.retryable).toBe(false);
		});

		it("읽은 값을 고쳐도 저장값은 바뀌지 않는다", async () => {
			await store.put(target, write("s1"));
			const stored = await store.get(target, "s1");
			if (stored) {
				stored.answers.name = "변조";
			}
			const again = await store.get(target, "s1");
			expect(again?.answers.name).toBe("홍길동");
		});
	});
}
