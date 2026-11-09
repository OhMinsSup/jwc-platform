import { definePlugin, defineRule } from "vite-plus/lint/plugins";
import type { ESTree } from "vite-plus/lint/plugins";

/**
 * 이 레포 전용 Oxlint JS 플러그인 (vite.config.ts의 lint.jsPlugins).
 *
 * jwc/no-reexport: 배럴 파일과 재노출을 막는다 (ADR-0007).
 * 모든 심볼은 정의한 파일에서 바로 import한다. 다른 모듈/패키지에서 가져온 것을 다시 내보내지 않는다.
 *   export * from "./x"                         → 금지
 *   export { a } from "./x" (type 포함)          → 금지
 *   import { a } from "./x"; export { a }       → 금지
 *   import a from "./x"; export default a       → 금지
 * 이 파일에서 정의한 것을 내보내는 것은 허용한다 (export { localThing }).
 */

const MESSAGE =
	"재노출 금지: 정의한 파일에서 직접 import하도록 바꾼다 (배럴/re-export 금지, ADR-0007)";

function localName(specifier: ESTree.ExportSpecifier): string | null {
	return specifier.local.type === "Identifier" ? specifier.local.name : null;
}

const noReexport = defineRule({
	meta: {
		type: "problem",
		docs: { description: "배럴 파일과 재노출을 금지한다" },
	},
	create(context) {
		/** 이 파일이 import한 지역 이름 */
		const imported = new Set<string>();
		return {
			ImportDeclaration(node) {
				for (const specifier of node.specifiers) {
					imported.add(specifier.local.name);
				}
			},
			ExportAllDeclaration(node) {
				context.report({ node, message: MESSAGE });
			},
			ExportNamedDeclaration(node) {
				if (node.source !== null) {
					context.report({ node, message: MESSAGE });
					return;
				}
				for (const specifier of node.specifiers) {
					const name = localName(specifier);
					if (name !== null && imported.has(name)) {
						context.report({ node: specifier, message: MESSAGE });
					}
				}
			},
			ExportDefaultDeclaration(node) {
				const { declaration } = node;
				if (
					declaration.type === "Identifier" &&
					imported.has(declaration.name)
				) {
					context.report({ node, message: MESSAGE });
				}
			},
		};
	},
});

export default definePlugin({
	meta: { name: "jwc" },
	rules: { "no-reexport": noReexport },
});
