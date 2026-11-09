import { readFileSync, writeFileSync } from "node:fs";

import { z } from "zod";

import { PERFORMANCE_ACCOUNTS } from "./settings.ts";

// Cloudflare preview는 빌드에 선언된 바인딩만 읽는다. 기본값·optional 키는 선언이 없으므로
// performance 빌드에만 공개 더미 바인딩을 추가한다. 일반 build/deploy에는 이 단계를 쓰지 않는다.
const output = new URL("../../.cloudflare/output/v0/", import.meta.url);
z.object({ buildContext: z.object({ mode: z.literal("performance") }) }).parse(
	JSON.parse(readFileSync(new URL("config.json", output), "utf-8")),
);
const path = new URL("workers/default/worker.config.json", output);
const config = z
	.looseObject({ env: z.record(z.string(), z.unknown()) })
	.parse(JSON.parse(readFileSync(path, "utf-8")));
config.env.SUBMISSION_STORE = { type: "text", value: "memory" };
config.env.SMS_MODE = { type: "text", value: "log" };
config.env.ADMIN_PHONES = {
	type: "text",
	value: Object.values(PERFORMANCE_ACCOUNTS)
		.map((account) => `${account.email}=${account.phone}`)
		.join(","),
};
writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
