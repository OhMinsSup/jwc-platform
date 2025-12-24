import { commandExists, fail, run } from "../shared.mjs";

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

function assertGeminiCliAvailable() {
	if (commandExists("gemini")) {
		return;
	}

	fail(
		[
			"gemini CLI not found in PATH.",
			"Install it and authenticate first, then re-run with:",
			"- --provider gemini-cli",
			"If you don't have it installed, use --provider github-models instead.",
		].join("\n")
	);
}

export function runGeminiCli({ systemPrompt, userPrompt }) {
	assertGeminiCliAvailable();

	// NOTE: Gemini CLI flags can vary by version. We keep this intentionally simple.
	// If flags don't match your installed gemini-cli, we print the stderr.
	const prompt = `${systemPrompt}\n\n${userPrompt}`;

	const result = run("gemini", ["-m", DEFAULT_MODEL, "-p", prompt], {
		stdio: "pipe",
	});

	if (result.status !== 0) {
		const stderr = (result.stderr ?? "").trim();
		fail(`gemini CLI failed (exit ${result.status}).\n${stderr}`);
	}

	const stdout = (result.stdout ?? "").trim();
	if (stdout.length === 0) {
		fail("gemini CLI returned empty output");
	}

	return stdout;
}
