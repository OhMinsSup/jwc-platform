#!/usr/bin/env node
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { selectCompiler } from "./compiler.mjs";

const require = createRequire(import.meta.url);
const compiler = selectCompiler(process.platform, process.arch);
if (compiler === "typescript") {
	console.warn(
		`jwc-typecheck: tsrs is not enabled for ${process.platform}/${process.arch}; using TypeScript (tsc).`,
	);
}
const entry = path.join(
	path.dirname(require.resolve(`${compiler}/package.json`)),
	"bin",
	compiler === "tsrs" ? "tsrs" : "tsc",
);
await import(pathToFileURL(entry).href);
