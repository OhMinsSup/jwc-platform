import { allowedFields, scrub } from "./catalog";
import type { EventCatalog, EventFields } from "./catalog";
import { currentScope } from "./scope";

/**
 * 카탈로그 기반 구조화 로거. 요청 범위 안이면 requestId를 붙이고, analytics 이벤트와 보고 대상 예외는
 * PostHog 버퍼에 넣는다(전송은 범위가 끝난 뒤 한 번에).
 */

export type LogLevel = "info" | "warn" | "error";

/** 오류 추적에 보낼 수 있는 분류된 실패 (앱의 오류 카탈로그 결과를 이 모양으로 넘긴다) */
export interface ReportableFailure {
	code: string;
	/** 내부 문장 (사용자 문장 아님). 보내기 전에 정리한다 */
	internalMessage: string;
	level: LogLevel;
	/** false면 보고하지 않는다 (입력 오류처럼 정상 흐름) */
	report: boolean;
}

type Emit<C extends EventCatalog> = <E extends keyof C & string>(
	event: E,
	fields?: EventFields<C, E>,
) => void;

export interface Logger<C extends EventCatalog> {
	captureException: (failure: ReportableFailure, operation: string) => void;
	error: Emit<C>;
	info: Emit<C>;
	warn: Emit<C>;
}

const CONSOLE: Record<LogLevel, (line: string) => void> = {
	info: (line) => {
		console.log(line);
	},
	warn: (line) => {
		console.warn(line);
	},
	error: (line) => {
		console.error(line);
	},
};

/** 보고 대상 실패를 현재 범위의 PostHog 버퍼에 $exception으로 넣는다 (범위 밖이면 무시) */
function captureException(failure: ReportableFailure, operation: string): void {
	const scope = currentScope();
	if (!(scope && failure.report)) {
		return;
	}
	scope.captured.push({
		event: "$exception",
		timestamp: new Date().toISOString(),
		properties: {
			$exception_list: [
				{
					type: failure.code,
					value: scrub(failure.internalMessage),
					mechanism: { handled: true, synthetic: false },
				},
			],
			$exception_level: failure.level,
			code: failure.code,
			operation,
		},
	});
}
export function createLogger<C extends EventCatalog>(catalog: C): Logger<C> {
	function write<E extends keyof C & string>(
		level: LogLevel,
		event: E,
		fields: EventFields<C, E> = {},
	): void {
		const scope = currentScope();
		const safe = allowedFields(catalog, event, fields);
		CONSOLE[level](
			JSON.stringify({
				level,
				event,
				at: new Date().toISOString(),
				requestId: scope?.requestId,
				...safe,
			}),
		);
		if (scope && catalog[event]?.analytics === true) {
			scope.captured.push({
				event: event.replaceAll(".", "_"),
				properties: safe,
				timestamp: new Date().toISOString(),
			});
		}
	}

	return {
		info: (event, fields) => {
			write("info", event, fields);
		},
		warn: (event, fields) => {
			write("warn", event, fields);
		},
		error: (event, fields) => {
			write("error", event, fields);
		},
		captureException,
	};
}
