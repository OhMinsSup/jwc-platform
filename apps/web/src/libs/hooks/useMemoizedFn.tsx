import { useMemo, useRef } from "react";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type noop = (this: any, ...args: any[]) => any;

type PickFunction<T extends noop> = (
	this: ThisParameterType<T>,
	...args: Parameters<T>
) => ReturnType<T>;

export function useMemoizedFn<T extends noop>(fn: T) {
	const fnRef = useRef<T>(fn);

	fnRef.current = useMemo(() => fn, [fn]);

	const memoizedFn = useRef<PickFunction<T>>(undefined);
	if (!memoizedFn.current) {
		memoizedFn.current = function (this, ...args) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return fnRef.current.apply(this, args);
		};
	}

	return memoizedFn.current;
}
