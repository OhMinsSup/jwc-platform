import { fail } from "./shared.mjs";

export function parseArgs(argv) {
	const args = {
		provider: "github-models",
		base: undefined,
		head: "HEAD",
		apply: false,
		org: process.env.GITHUB_MODELS_ORG,
		outDir: ".ai",
		maxFiles: 50,
		maxTotalPatchChars: 60_000,
		maxPatchCharsPerFile: 8000,
	};

	for (let index = 2; index < argv.length; index += 1) {
		const token = argv[index];
		if (token === "--apply") {
			args.apply = true;
			continue;
		}
		if (token === "--provider") {
			args.provider = argv[index + 1] ?? "";
			index += 1;
			continue;
		}
		if (token === "--base") {
			args.base = argv[index + 1];
			index += 1;
			continue;
		}
		if (token === "--head") {
			args.head = argv[index + 1];
			index += 1;
			continue;
		}
		if (token === "--org") {
			args.org = argv[index + 1];
			index += 1;
			continue;
		}
		if (token === "--out") {
			args.outDir = argv[index + 1];
			index += 1;
			continue;
		}

		fail(`Unknown arg: ${token}`);
	}

	if (!args.provider) {
		fail("--provider is required");
	}

	return args;
}
