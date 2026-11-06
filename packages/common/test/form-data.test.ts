import { describe, expect, it } from "vite-plus/test";

import { formText } from "../src/form-data";

describe(formText, () => {
	it("returns the text value of an input", () => {
		const data = new FormData();
		data.set("title", "2026 여름 수련회");
		expect(formText(data, "title")).toBe("2026 여름 수련회");
	});

	it("returns an empty string for a missing name or a file entry", () => {
		const data = new FormData();
		data.set("upload", new File(["x"], "a.txt"));
		expect(formText(data, "missing")).toBe("");
		expect(formText(data, "upload")).toBe("");
	});
});
