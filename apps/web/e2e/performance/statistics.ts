import type { VitalValues } from "./metrics";

const VITALS = ["LCP", "INP", "CLS", "TTFB"] as const;

/** nearest-rank p75. 여러 번의 실험실 실행을 집계하며 실제 사용자 분포를 추정하지 않는다. */
export function distribution(values: number[]) {
	if (values.length === 0) {
		return null;
	}
	const sorted = values.toSorted((left, right) => left - right);
	return {
		count: sorted.length,
		min: sorted[0],
		p75: sorted[Math.ceil(sorted.length * 0.75) - 1],
		max: sorted.at(-1),
	};
}

export function summarize(results: { metrics: VitalValues }[]) {
	return Object.fromEntries(
		VITALS.map((name) => [
			name,
			distribution(
				results.flatMap(({ metrics }) => {
					const value = metrics[name];
					return value === undefined ? [] : [value];
				}),
			),
		]),
	);
}
