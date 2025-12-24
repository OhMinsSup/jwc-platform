const TITLE_REGEX =
	/^(feat|fix|chore|refactor|docs|test|perf|build|ci|style|revert)\([a-z0-9-]+\):\s.+/;

export function validateTitle(title) {
	return TITLE_REGEX.test(title);
}

const SCOPE_RULES = [
	{ scope: "web", prefix: "apps/web/" },
	{ scope: "backend", prefix: "packages/backend/" },
	{ scope: "ui", prefix: "packages/ui/" },
	{ scope: "utils", prefix: "packages/utils/" },
	{ scope: "env", prefix: "packages/env/" },
	{ scope: "schema", prefix: "packages/schema/" },
	{ scope: "spreadsheet", prefix: "packages/spreadsheet/" },
	{ scope: "tooling", prefix: "tooling/" },
];

const LABEL_RULES = [
	{ label: "web", prefix: "apps/web/" },
	{ label: "backend", prefix: "packages/backend/" },
	{ label: "ui", prefix: "packages/ui/" },
	{ label: "utils", prefix: "packages/utils/" },
	{ label: "env", prefix: "packages/env/" },
	{ label: "schema", prefix: "packages/schema/" },
	{ label: "spreadsheet", prefix: "packages/spreadsheet/" },
	{ label: "tooling", prefix: "tooling/" },
];

export function pickScopeFromPaths(filePaths) {
	const counts = new Map(SCOPE_RULES.map((b) => [b.scope, 0]));
	for (const filePath of filePaths) {
		const normalized = filePath.replaceAll("\\", "/");
		for (const bucket of SCOPE_RULES) {
			if (normalized.startsWith(bucket.prefix)) {
				counts.set(bucket.scope, (counts.get(bucket.scope) ?? 0) + 1);
				break;
			}
		}
	}

	let bestScope = "repo";
	let bestCount = 0;
	for (const [scope, count] of counts.entries()) {
		if (count > bestCount) {
			bestScope = scope;
			bestCount = count;
		}
	}

	return bestCount === 0 ? "repo" : bestScope;
}

export function suggestedLabelsFromPaths(filePaths) {
	const labelSet = new Set();
	for (const filePath of filePaths) {
		const normalized = filePath.replaceAll("\\", "/");
		for (const rule of LABEL_RULES) {
			if (normalized.startsWith(rule.prefix)) {
				labelSet.add(rule.label);
			}
		}
	}
	return [...labelSet.values()];
}
