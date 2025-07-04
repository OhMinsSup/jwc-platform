import * as Sentry from "@sentry/nextjs";
import { createConsola } from "consola";

type Platform =
	| "web-platform"
	| "admin-platform"
	| "server"
	| "client"
	| "platform";

type LogCategory =
	| "endpoints"
	| "rpc"
	| "google"
	| "serverActions"
	| "collectionHooks"
	| "payload"
	| "components"
	| "observability"
	| "instrumentation"
	| "internalApi"
	| "misc";

type Extra = {
	name?: string;
	action?: string;
	[key: string]: unknown;
};

class Logger {
	output: ReturnType<typeof createConsola>;

	public constructor(tag: Platform = "platform") {
		this.output = createConsola().withTag(tag);
	}

	public info(label: LogCategory, error: string | Error, extra?: Extra) {
		this.output.info(error, { ...this.sanitize(extra), label });
	}

	public debug(label: LogCategory, error: string | Error, extra?: Extra) {
		this.output.debug(error, { ...this.sanitize(extra), label });
	}

	public error(label: LogCategory, error: string | Error, extra?: Extra) {
		if (
			process.env.NODE_ENV === "production" &&
			process.env.NEXT_PUBLIC_SENTRY_DSN
		) {
			const err = error instanceof Error ? error : new Error(error);
			const sanitizeExtra = this.sanitize(extra);
			const tags = {
				name: extra?.name ?? "Logger",
				action: extra?.action ?? "error",
				label,
			};

			const opts = {
				tags,
				extra: sanitizeExtra,
				level: "error" as const,
			};

			Sentry.logger.error(err.message, opts);
			Sentry.captureException(err, opts);
			this.output.error(error, label, opts);
		} else {
			this.output.error(error, label, this.sanitize(extra));
		}
	}

	private sanitize = <T>(input: T, level = 0): T => {
		if (process.env.NODE_ENV !== "production") {
			return input;
		}

		const sensitiveFields = ["token", "password", "content"];

		if (level > 3) {
			return "[…]" as unknown as T;
		}

		if (Array.isArray(input)) {
			return input.map((item) =>
				this.sanitize(item, level + 1)
			) as unknown as T;
		}

		if (typeof input === "object" && input !== null) {
			const output: Record<string, unknown> = {
				...(input as Record<string, unknown>),
			};

			for (const key of Object.keys(output)) {
				if (typeof output[key] === "object" && output[key] !== null) {
					output[key] = this.sanitize(output[key], level + 1);
				} else if (Array.isArray(output[key])) {
					output[key] = (output[key] as unknown[]).map((value: unknown) =>
						this.sanitize(value, level + 1)
					);
				} else if (sensitiveFields.includes(key)) {
					output[key] = "[Filtered]";
				} else {
					output[key] = this.sanitize(output[key], level + 1);
				}
			}
			return output as T;
		}

		return input;
	};
}

const logger = new Logger();

export { logger as log, Logger, type LogCategory, type Extra, type Platform };
