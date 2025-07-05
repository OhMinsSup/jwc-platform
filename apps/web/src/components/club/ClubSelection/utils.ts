// Rich Text 내용을 일반 텍스트로 변환하는 함수
export const extractTextFromRichText = (content: unknown): string => {
	if (!content || typeof content !== "object") return "";

	const contentObj = content as { root?: { children?: unknown[] } };
	if (!contentObj.root?.children?.length) return "";

	const extractText = (node: unknown): string => {
		if (!node || typeof node !== "object") return "";

		const nodeObj = node as {
			type?: string;
			text?: string;
			children?: unknown[];
		};

		switch (nodeObj.type) {
			case "text":
				return nodeObj.text || "";
			case "linebreak":
				return "\n";
			default:
				return nodeObj.children?.map(extractText).join("") || "";
		}
	};

	return contentObj.root.children.map(extractText).join("\n").trim();
};
