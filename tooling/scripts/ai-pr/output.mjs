import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { validateTitle } from "./rules.mjs";
import { commandExists, fail, run } from "./shared.mjs";

export function normalizeModelResult({
	modelResult,
	scopeFallback,
	labelFallbacks,
}) {
	const title =
		typeof modelResult.title === "string" ? modelResult.title.trim() : "";
	const body =
		typeof modelResult.body === "string" ? modelResult.body.trim() : "";
	const labels = Array.isArray(modelResult.labels)
		? modelResult.labels
				.filter((l) => typeof l === "string")
				.map((l) => l.trim())
		: [];

	const fallbackTitle = `feat(${scopeFallback}): update`;
	const safeTitle = validateTitle(title) ? title : fallbackTitle;
	const safeBody = body.length > 0 ? body : "## Summary\n\n(작성 필요)\n";

	const mergedLabels = [
		...new Set([...labelFallbacks, ...labels].filter(Boolean)),
	];
	return { title: safeTitle, body: safeBody, labels: mergedLabels };
}

export function writeOutputs({ outDir, title, body, labels }) {
	mkdirSync(outDir, { recursive: true });

	const outJsonPath = join(outDir, "pr.json");
	const outMdPath = join(outDir, "pr.md");

	writeFileSync(
		outJsonPath,
		`${JSON.stringify(
			{
				title,
				body,
				labels,
			},
			null,
			2
		)}\n`,
		"utf8"
	);

	writeFileSync(outMdPath, `${body}\n`, "utf8");
	return { outJsonPath, outMdPath };
}

export function applyWithGh({ baseRef, title, outMdPath, labels }) {
	if (!commandExists("gh")) {
		process.stdout.write(
			"\n--apply was set, but gh is not installed. Skipping PR create/edit.\n"
		);
		process.stdout.write("\nIf you have gh installed, you can run:\n");
		process.stdout.write(
			`gh pr create --base ${baseRef} --title ${JSON.stringify(title)} --body-file ${outMdPath}\n`
		);
		return;
	}

	const labelArgs = labels.flatMap((label) => ["--label", label]);

	let prNumber = "";
	try {
		prNumber = run("gh", ["pr", "view", "--json", "number", "-q", ".number"], {
			stdio: ["ignore", "pipe", "pipe"],
		});
	} catch {
		prNumber = "";
	}

	if (prNumber) {
		run("gh", [
			"pr",
			"edit",
			prNumber,
			"--title",
			title,
			"--body-file",
			outMdPath,
			...labelArgs,
		]);
		process.stdout.write(`Updated PR #${prNumber}\n`);
		return;
	}

	run("gh", [
		"pr",
		"create",
		"--base",
		baseRef,
		"--title",
		title,
		"--body-file",
		outMdPath,
		...labelArgs,
	]);
	process.stdout.write("Created PR\n");
}

export function assertProvider(provider) {
	if (provider === "github-models" || provider === "gemini-cli") {
		return;
	}
	fail(`Unsupported provider: ${provider}`);
}
