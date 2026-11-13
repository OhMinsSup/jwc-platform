import { spawn } from "node:child_process";
import { closeSync, openSync, writeFileSync } from "node:fs";
import path from "node:path";

const DEFAULT_TIMEOUT_MS = 600_000;

export interface ExecutionContext {
	directory: string;
	name: string;
	root: string;
	env: NodeJS.ProcessEnv;
	timeout?: number;
}

export function execute(
	command: string,
	args: string[],
	context: ExecutionContext,
): Promise<number> {
	const stdout = openSync(
		path.join(context.directory, `${context.name}.json`),
		"w",
		0o600,
	);
	const stderr = openSync(
		path.join(context.directory, `${context.name}.log`),
		"w",
		0o600,
	);
	const { promise, resolve } = Promise.withResolvers<number>();
	const child = spawn(command, args, {
		cwd: context.root,
		env: context.env,
		stdio: ["ignore", stdout, stderr],
	});
	let failed = false;
	const timer = setTimeout(() => {
		failed = true;
		child.kill("SIGKILL");
	}, context.timeout ?? DEFAULT_TIMEOUT_MS);
	child.once("error", (error) => {
		failed = true;
		const code =
			"code" in error && typeof error.code === "string"
				? error.code
				: "UNKNOWN";
		writeFileSync(stderr, `도구 실행 실패: ${code}\n`);
	});
	child.once("close", (code) => {
		clearTimeout(timer);
		closeSync(stdout);
		closeSync(stderr);
		resolve(failed ? 2 : (code ?? 2));
	});
	return promise;
}
