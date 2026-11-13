import { parse } from "yaml";
import { z } from "zod";

const LOCK = z.object({
	lockfileVersion: z.literal("9.0"),
	packages: z.record(z.string(), z.unknown()),
	snapshots: z
		.record(z.string(), z.object({ optional: z.boolean().optional() }))
		.default({}),
});
const RECORD = z.record(z.string(), z.unknown());
const GUARDDOG = z.object({
	errors: RECORD,
	issues: z.number().int().nonnegative(),
	risks: z.array(z.unknown()),
});
export function optionalPackages(source: string) {
	const parsed: unknown = parse(source);
	const lock = LOCK.parse(parsed);
	const entries = new Map<string, boolean>();
	for (const [snapshot, value] of Object.entries(lock.snapshots)) {
		const [key] = snapshot.split("(");
		if (key) {
			entries.set(key, (entries.get(key) ?? true) && value.optional === true);
		}
	}
	return [...entries].filter(([, optional]) => optional).map(([key]) => key);
}

const DEPENDENCY_GROUPS = [
	"dependencies",
	"devDependencies",
	"optionalDependencies",
];

export function lockedPackages(source: string) {
	const parsed: unknown = parse(source);
	const result = LOCK.safeParse(parsed);
	if (!result.success) {
		throw new Error("pnpm lockfile v9의 packages가 필요합니다.");
	}
	return new Set(Object.keys(result.data.packages));
}

export function installedPaths(projects: unknown) {
	const parsed = z.array(z.unknown()).nonempty().safeParse(projects);
	if (!parsed.success) {
		throw new Error("pnpm이 설치된 프로젝트 목록을 반환하지 않았습니다.");
	}
	const paths = new Set<string>();
	const pending = [...parsed.data];
	while (pending.length > 0) {
		const node = RECORD.parse(pending.pop());
		for (const group of DEPENDENCY_GROUPS) {
			for (const value of Object.values(RECORD.parse(node[group] ?? {}))) {
				const dependency = RECORD.parse(value);
				if (typeof dependency.path !== "string") {
					throw new TypeError("설치된 패키지의 경로가 누락됐습니다.");
				}
				paths.add(dependency.path);
				pending.push(dependency);
			}
		}
	}
	return [...paths].toSorted();
}

export function guarddogExitCode(report: unknown) {
	const result = GUARDDOG.safeParse(report);
	if (!result.success || Object.keys(result.data.errors).length > 0) {
		return 2;
	}
	return result.data.issues > 0 || result.data.risks.length > 0 ? 1 : 0;
}

export async function runChecks(
	checks: string[],
	run: (name: string) => Promise<number>,
) {
	const results: { check: string; exitCode: number; error?: string }[] = [];
	for (const check of checks) {
		try {
			// oxlint-disable-next-line no-await-in-loop -- 도구별 메모리·네트워크 경합을 줄이고 실패 후에도 다음 검사를 수행한다.
			results.push({ check, exitCode: await run(check) });
		} catch (error) {
			results.push({
				check,
				exitCode: 2,
				error: error instanceof Error ? error.message : "검사 오류",
			});
		}
	}
	return results;
}
