import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import {
	guarddogExitCode,
	installedPaths,
	lockedPackages,
	optionalPackages,
	runChecks,
} from "./model.ts";
import { execute } from "./process.ts";
import type { ExecutionContext } from "./process.ts";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CACHE = path.join(ROOT, ".cache/security");
const BIN = path.join(ROOT, ".cache/security-tools/bin");
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const CHECKS = ["audit", "osv", "code", "malware"];
const WORKERS = 4;
const PACKAGE_TIMEOUT_MS = 180_000;
interface Target {
	id: string;
	location: string;
}
interface PackageResult {
	package: string;
	exitCode: number;
	report: string;
}
const MANIFEST = z.object({ name: z.string(), version: z.string() });

function context(directory: string, name: string): ExecutionContext {
	return {
		directory,
		name,
		root: ROOT,
		env: {
			PATH: process.env.PATH,
			HOME: path.join(CACHE, "home"),
			SEMGREP_SEND_METRICS: "off",
		},
	};
}

function readJson(directory: string, name: string): unknown {
	return JSON.parse(
		readFileSync(path.join(directory, `${name}.json`), "utf-8"),
	);
}

function packageTargets(projects: unknown, filter?: string) {
	const source = readFileSync(path.join(ROOT, "pnpm-lock.yaml"), "utf-8");
	const lock = lockedPackages(source);
	const excluded = optionalPackages(source).map((key) =>
		key.replaceAll("/", "+"),
	);
	const store = `${realpathSync(path.join(ROOT, "node_modules/.pnpm"))}${path.sep}`;
	const targets = new Map<string, Target>();
	let skipped = 0;
	for (const installed of installedPaths(projects)) {
		const [folder] = path.relative(store, installed).split(path.sep);
		if (
			!existsSync(installed) &&
			excluded.some((key) => folder === key || folder?.startsWith(`${key}_`))
		) {
			skipped += 1;
			continue;
		}
		const location = realpathSync(installed);
		if (!location.startsWith(store)) {
			continue;
		}
		const manifest = MANIFEST.parse(readJson(location, "package"));
		const id = `${manifest.name}@${manifest.version}`;
		if (!lock.has(id)) {
			throw new Error(
				"설치된 패키지가 lockfile과 다릅니다. pnpm install --frozen-lockfile을 실행하세요.",
			);
		}
		if (!filter || manifest.name === filter) {
			targets.set(id, { id, location });
		}
	}
	if (targets.size === 0) {
		throw new Error(
			"검사할 설치 패키지가 없습니다. 패키지 이름과 pnpm install 상태를 확인하세요.",
		);
	}
	console.log(
		JSON.stringify({
			scan: "malware",
			skippedUninstalledOptionalPackages: skipped,
		}),
	);
	return [...targets.values()].toSorted((left, right) =>
		left.id.localeCompare(right.id),
	);
}

async function scanPackage(
	target: Target,
	index: number,
	directory: string,
): Promise<PackageResult> {
	const name = `guarddog-${index}`;
	const code = await execute(
		path.join(BIN, "guarddog"),
		[
			"npm",
			"scan",
			target.location,
			"--output-format=json",
			"--exit-non-zero-on-finding",
		],
		{ ...context(directory, name), timeout: PACKAGE_TIMEOUT_MS },
	);
	if (code > 1) {
		return { package: target.id, exitCode: 2, report: `${name}.json` };
	}
	try {
		return {
			package: target.id,
			exitCode: Math.max(code, guarddogExitCode(readJson(directory, name))),
			report: `${name}.json`,
		};
	} catch (error) {
		if (!(error instanceof SyntaxError)) {
			throw error;
		}
		return { package: target.id, exitCode: 2, report: `${name}.json` };
	}
}

async function malware(directory: string, filter?: string) {
	const listing = await execute(
		PNPM,
		["list", "--recursive", "--depth", "Infinity", "--json"],
		context(directory, "installed"),
	);
	if (listing !== 0) {
		return listing;
	}
	const targets = packageTargets(readJson(directory, "installed"), filter);
	console.log(
		JSON.stringify({
			scan: "malware",
			scope: filter ? "selected-installed-package" : "all-installed-packages",
			packages: targets.length,
		}),
	);
	let next = 0;
	const results: PackageResult[] = [];
	async function worker() {
		while (next < targets.length) {
			const index = next;
			next += 1;
			const target = targets[index];
			if (!target) {
				return;
			}
			// oxlint-disable-next-line no-await-in-loop -- 4개 worker만 실행해 프로세스·메모리 사용량을 제한한다.
			const result = await scanPackage(target, index, directory);
			results.push(result);
			console.log(
				JSON.stringify({
					scan: "malware",
					completed: results.length,
					total: targets.length,
					...result,
				}),
			);
		}
	}
	await Promise.all(Array.from({ length: WORKERS }, worker));
	writeFileSync(
		path.join(directory, "malware.json"),
		JSON.stringify(results, null, 2),
	);
	return Math.max(...results.map((result) => result.exitCode));
}

async function scan(check: string, directory: string, filter?: string) {
	if (check === "malware") {
		return await malware(directory, filter);
	}
	const commands: Record<string, [string, string[]]> = {
		audit: [PNPM, ["audit", "--json"]],
		osv: [
			"osv-scanner",
			["scan", "source", "--lockfile=pnpm-lock.yaml", "--format=json"],
		],
		code: [
			path.join(BIN, "semgrep"),
			[
				"scan",
				"--config=p/security-audit",
				"--oss-only",
				"--metrics=off",
				"--strict",
				"--error",
				"--json",
				"apps/web/src",
				"packages",
				"tooling",
			],
		],
	};
	const selected = commands[check];
	if (!selected) {
		throw new Error("지원하지 않는 보안 검사입니다.");
	}
	const [command, args] = selected;
	return await execute(command, args, context(directory, check));
}

async function main() {
	const [check = "all", ...args] = process.argv.slice(2);
	if (
		(!CHECKS.includes(check) && check !== "all") ||
		(args.length > 0 &&
			(check !== "malware" || args.length !== 2 || args[0] !== "--package"))
	) {
		throw new Error(
			"사용법: security [all|audit|osv|code|malware [--package 이름]]",
		);
	}
	mkdirSync(path.join(CACHE, "reports"), { recursive: true });
	mkdirSync(path.join(CACHE, "home"), { recursive: true });
	const directory = mkdtempSync(path.join(CACHE, "reports/run-"));
	console.log(JSON.stringify({ reports: directory }));
	const results = await runChecks(
		check === "all" ? CHECKS : [check],
		async (name) => {
			const exitCode = await scan(name, directory, args[1]);
			console.log(JSON.stringify({ scan: name, exitCode, reports: directory }));
			return exitCode;
		},
	);
	writeFileSync(
		path.join(directory, "summary.json"),
		JSON.stringify(results, null, 2),
	);
	process.exitCode = results.some((result) => result.exitCode !== 0) ? 1 : 0;
}

try {
	await main();
} catch (error) {
	console.error(
		JSON.stringify({
			error: error instanceof Error ? error.message : "보안 검사 오류",
		}),
	);
	process.exitCode = 2;
}
