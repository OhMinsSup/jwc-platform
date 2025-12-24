import { spawnSync } from "node:child_process";

export function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

export function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
		...options,
	});

	if (result.error) {
		throw result.error;
	}
	if (result.status !== 0) {
		const stderr = (result.stderr ?? "").trim();
		throw new Error(
			`${command} ${args.join(" ")} failed: ${stderr || `exit ${result.status}`}`
		);
	}

	return (result.stdout ?? "").trimEnd();
}

export function commandExists(command) {
	const result = spawnSync("command", ["-v", command], { encoding: "utf8" });
	return result.status === 0;
}

export function extractJsonObject(text) {
	const trimmed = text.trim();
	if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
		return trimmed;
	}

	const firstBrace = trimmed.indexOf("{");
	const lastBrace = trimmed.lastIndexOf("}");
	if (firstBrace >= 0 && lastBrace > firstBrace) {
		return trimmed.slice(firstBrace, lastBrace + 1);
	}

	return null;
}

export function parseJsonOrFail(content) {
	const extracted = extractJsonObject(content);
	if (!extracted) {
		fail(`Model output is not JSON. Output:\n${content}`);
	}

	try {
		return JSON.parse(extracted);
	} catch {
		fail(`Failed to parse JSON. Output:\n${extracted}`);
	}
}
