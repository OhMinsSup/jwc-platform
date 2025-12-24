import { fail } from "../shared.mjs";

const DEFAULT_MODEL = process.env.GITHUB_MODELS_MODEL ?? "openai/gpt-4.1";
const DEFAULT_API_VERSION = "2022-11-28";

function getTokenOrFail() {
	const token = process.env.GITHUB_MODELS_TOKEN ?? process.env.GITHUB_TOKEN;
	if (token) {
		return token;
	}

	fail(
		[
			"Missing token.",
			"Set one of:",
			"- GITHUB_MODELS_TOKEN (recommended)",
			"- GITHUB_TOKEN",
			"Token needs models:read permission for GitHub Models inference.",
		].join("\n")
	);
}

export async function runGitHubModels({ org, systemPrompt, userPrompt }) {
	const token = getTokenOrFail();

	const endpoint = org
		? `https://models.github.ai/orgs/${encodeURIComponent(org)}/inference/chat/completions`
		: "https://models.github.ai/inference/chat/completions";

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${token}`,
			"X-GitHub-Api-Version": DEFAULT_API_VERSION,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: DEFAULT_MODEL,
			temperature: 0.2,
			max_tokens: 1200,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
		}),
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => "");
		fail(`GitHub Models request failed: ${response.status}\n${errorText}`);
	}

	const json = await response.json();
	const content = json?.choices?.[0]?.message?.content;
	if (typeof content !== "string" || content.trim().length === 0) {
		fail("Model response missing choices[0].message.content");
	}

	return content;
}
