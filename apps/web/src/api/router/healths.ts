import { pub } from "~/api/orpc";

export const health = pub
	.route({
		method: "GET",
		path: "/health",
		summary: "Health Check",
		tags: ["Health"],
	})
	.handler(() => ({ status: "ok", timestamp: new Date().toISOString() }));
