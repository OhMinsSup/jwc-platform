import { writeFileSync, writeSync } from "node:fs";

import { devices, expect, test } from "@playwright/test";

import { measure } from "./measure";
import { performancePages } from "./pages";
import type { PerformancePage } from "./pages";
import { GOOD_BUDGETS } from "./settings";
import { summarize } from "./statistics";
import { prepareSubmission } from "./submission";

type Sample = Awaited<ReturnType<typeof measure>>;

async function measurePage(
	browser: Parameters<typeof measure>[0],
	target: PerformancePage,
	samples: number,
) {
	const results: Sample[] = [];
	for (let sample = 0; sample < samples; sample += 1) {
		// oxlint-disable-next-line no-await-in-loop -- 표본은 직렬 측정해 CPU·네트워크 간섭을 막는다.
		const result = await measure(browser, target, devices["Pixel 7"]);
		results.push(result);
		writeSync(1, `${target.name}: ${JSON.stringify(result)}\n`);
	}
	return { page: target.name, results, summary: summarize(results) };
}

function assertBudgets(result: Awaited<ReturnType<typeof measurePage>>) {
	for (const metric of ["LCP", "INP", "CLS"] as const) {
		const value = result.summary[metric];
		if (
			metric === "INP" &&
			result.results.every((sample) => !sample.requiresInp) &&
			value === null
		) {
			continue;
		}
		expect.soft(value?.p75, `${result.page} ${metric} p75`).toBeDefined();
		expect
			.soft(value?.p75, `${result.page} ${metric} p75`)
			.toBeLessThanOrEqual(GOOD_BUDGETS[metric]);
	}
}

test("모든 화면의 production 모바일 성능 예산", async ({
	browser,
}, testInfo) => {
	const submission = await prepareSubmission(browser);
	const samples = Number(testInfo.config.metadata.samples);
	const results: Awaited<ReturnType<typeof measurePage>>[] = [];
	const failures: string[] = [];
	for (const target of performancePages(submission)) {
		try {
			// oxlint-disable-next-line no-await-in-loop -- 페이지도 직렬 측정해 자원 간섭을 막는다. 측정 실패는 마지막에 함께 보고한다.
			const result = await test.step(target.name, () =>
				measurePage(browser, target, samples),
			);
			results.push(result);
		} catch (error) {
			failures.push(target.name);
			const reason =
				error instanceof Error
					? error.message.replaceAll(submission.slice(3), "[fixture]")
					: "unknown";
			writeSync(1, `${target.name}: measurement_failed ${reason}\n`);
		}
	}
	const body = JSON.stringify(
		{ budgets: GOOD_BUDGETS, samples, failures, results },
		null,
		2,
	);
	writeFileSync(testInfo.outputPath("vitals.json"), body);
	await testInfo.attach("page-vitals", {
		body,
		contentType: "application/json",
	});
	expect.soft(failures, "측정 실패 화면").toEqual([]);
	for (const result of results) {
		assertBudgets(result);
	}
});
