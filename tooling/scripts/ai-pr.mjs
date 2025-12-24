#!/usr/bin/env node

/*
Problem 1-Pager / 대안 비교 / 사용법: tooling/scripts/ai-pr/README.md

의도:
- git diff를 수집(민감 파일 제외)하고 PR 타이틀/본문/라벨을 생성한다.
- gh CLI가 있으면 선택적으로 PR을 create/edit 한다.
*/

import { parseArgs } from "./ai-pr/args.mjs";
import {
	buildPatchSections,
	getChangedFiles,
	getDiffStat,
	getGitInfo,
	resolveBaseRef,
} from "./ai-pr/git.mjs";
import {
	applyWithGh,
	assertProvider,
	normalizeModelResult,
	writeOutputs,
} from "./ai-pr/output.mjs";
import { buildPrompts } from "./ai-pr/prompt.mjs";
import { runGeminiCli } from "./ai-pr/providers/gemini-cli.mjs";
import { runGitHubModels } from "./ai-pr/providers/github-models.mjs";
import {
	pickScopeFromPaths,
	suggestedLabelsFromPaths,
} from "./ai-pr/rules.mjs";
import { fail, parseJsonOrFail } from "./ai-pr/shared.mjs";

async function main() {
	const args = parseArgs(process.argv);
	assertProvider(args.provider);

	const baseRef = resolveBaseRef(args.base);
	const headRef = args.head;
	const { baseCommit, currentBranch, headSha, repoUrl } = getGitInfo(
		baseRef,
		headRef
	);

	const files = getChangedFiles(baseCommit, headRef, args.maxFiles);
	const scopeSuggestion = pickScopeFromPaths(files);
	const labelSuggestions = suggestedLabelsFromPaths(files);

	const diffStat = getDiffStat(baseCommit, headRef);
	const patches = await buildPatchSections({
		baseCommit,
		headRef,
		filePaths: files,
		limits: {
			maxTotalPatchChars: args.maxTotalPatchChars,
			maxPatchCharsPerFile: args.maxPatchCharsPerFile,
		},
	});

	const { systemPrompt, userPrompt } = buildPrompts({
		repoUrl,
		baseRef,
		baseCommit,
		headRef,
		headSha,
		currentBranch,
		diffStat,
		files,
		scope: scopeSuggestion,
		labels: labelSuggestions,
		patches,
	});

	let content = "";
	if (args.provider === "gemini-cli") {
		content = runGeminiCli({ systemPrompt, userPrompt });
	} else {
		content = await runGitHubModels({
			org: args.org,
			systemPrompt,
			userPrompt,
		});
	}

	const modelResult = parseJsonOrFail(content);
	const normalized = normalizeModelResult({
		modelResult,
		scopeFallback: scopeSuggestion === "repo" ? "repo" : scopeSuggestion,
		labelFallbacks: labelSuggestions,
	});

	const { outJsonPath, outMdPath } = writeOutputs({
		outDir: args.outDir,
		title: normalized.title,
		body: normalized.body,
		labels: normalized.labels,
	});

	process.stdout.write(`Generated:\n- ${outJsonPath}\n- ${outMdPath}\n`);

	if (args.apply) {
		applyWithGh({
			baseRef,
			title: normalized.title,
			outMdPath,
			labels: normalized.labels,
		});
	}
}

main().catch((error) => {
	fail(error instanceof Error ? error.message : String(error));
});
