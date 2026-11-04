import handler from "@tanstack/react-start/server-entry";

import { dispatchQueue, dispatchScheduled } from "./src/server/worker-triggers";

/**
 * Cloudflare Worker 엔트리.
 * fetch는 TanStack Start, scheduled/queue는 crons/·queues/ 핸들러로 분배한다.
 */
export default {
	...handler,
	scheduled: dispatchScheduled,
	queue: dispatchQueue,
};
