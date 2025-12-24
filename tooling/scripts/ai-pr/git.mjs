import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { fail, run } from "./shared.mjs";

const NAME_STATUS_SPLIT_REGEX = /\s+/;
const MAX_TEXT_BYTES = 100_000;

export function resolveBaseRef(baseArg) {
	const candidates = baseArg ? [baseArg] : ["origin/main", "main"];
	for (const candidate of candidates) {
		try {
			run("git", ["rev-parse", "--verify", candidate]);
			return candidate;
		} catch {
			// keep trying
		}
	}
	fail(`Base ref not found. Tried: ${candidates.join(", ")}`);
}

export function getGitInfo(baseRef, headRef) {
	const baseCommit = run("git", ["merge-base", baseRef, headRef]);
	const currentBranch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
	const headSha = run("git", ["rev-parse", headRef]);

	let repoUrl = "(unknown)";
	try {
		const remote = run("git", ["config", "--get", "remote.origin.url"]);
		if (remote) {
			repoUrl = remote;
		}
	} catch {
		// ignore
	}

	return { baseCommit, currentBranch, headSha, repoUrl };
}

function parseNameStatusRow(row) {
	const parts = row.split(NAME_STATUS_SPLIT_REGEX).filter(Boolean);
	const status = parts[0] ?? "";

	if (status.startsWith("R") || status.startsWith("C")) {
		return parts[2] ?? parts[1] ?? "";
	}
	return parts[1] ?? "";
}

export function getChangedFiles(baseCommit, headRef, maxFiles) {
	const nameStatusRaw = run("git", [
		"diff",
		"--name-status",
		`${baseCommit}..${headRef}`,
	]);
	const fileRows = nameStatusRaw
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	const changedFiles = fileRows.map(parseNameStatusRow).filter(Boolean);
	if (changedFiles.length === 0) {
		fail("No changes detected (diff is empty). Nothing to generate.");
	}

	return changedFiles.slice(0, maxFiles);
}

export function isSensitivePath(filePath) {
	const normalized = filePath.replaceAll("\\", "/");
	if (normalized === ".env" || normalized.startsWith(".env.")) {
		return true;
	}
	if (normalized.includes("/secrets") || normalized.includes("/secret")) {
		return true;
	}
	if (normalized.endsWith("pnpm-lock.yaml")) {
		return true;
	}
	return false;
}

async function safeReadTextFile(filePath) {
	try {
		const buffer = await readFile(filePath);
		if (buffer.length > MAX_TEXT_BYTES) {
			return null;
		}
		if (buffer.includes(0)) {
			return null;
		}
		return buffer.toString("utf8");
	} catch {
		return null;
	}
}

export async function buildPatchSections({
	baseCommit,
	headRef,
	filePaths,
	limits,
}) {
	const patchSections = [];
	let totalPatchChars = 0;

	for (const filePath of filePaths) {
		if (isSensitivePath(filePath)) {
			patchSections.push(
				`### ${filePath}\n<excluded: sensitive or too large>\n`
			);
			continue;
		}

		const absolutePath = join(process.cwd(), filePath);
		const text = await safeReadTextFile(absolutePath);
		if (text === null) {
			patchSections.push(
				`### ${filePath}\n<excluded: missing/binary/too large>\n`
			);
			continue;
		}

		const patch = run("git", [
			"diff",
			"--no-color",
			`${baseCommit}..${headRef}`,
			"--",
			filePath,
		]);
		if (!patch) {
			patchSections.push(`### ${filePath}\n<no textual diff>\n`);
			continue;
		}

		const remainingBudget = limits.maxTotalPatchChars - totalPatchChars;
		if (remainingBudget <= 0) {
			break;
		}

		const clipped = patch.slice(
			0,
			Math.min(limits.maxPatchCharsPerFile, remainingBudget)
		);
		totalPatchChars += clipped.length;
		patchSections.push(`### ${filePath}\n\n\`\`\`diff\n${clipped}\n\`\`\`\n`);
	}

	return patchSections;
}

export function getDiffStat(baseCommit, headRef) {
	return run("git", ["diff", "--stat", `${baseCommit}..${headRef}`]);
}
