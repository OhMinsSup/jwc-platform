import React from "react";

export interface CreateContextOptions {
	strict?: boolean;
	errorMessage?: string;
	name?: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	defaultValue?: any;
}

type CreateContextReturn<T> = [React.Provider<T>, () => T, React.Context<T>];

/**
 * context를 생성합니다.
 * @param options - 옵션
 * @param options.strict - strict 모드 여부
 * @param options.errorMessage - 에러 메시지
 * @param options.name - context 이름
 * @param options.defaultValue - 기본값
 * @example
 * const [Provider, useContext, Context] = createContext<MyContext>({
 *   strict: true,
 *   errorMessage: "useMyContext: `context` is undefined. Seems you forgot to wrap component within the Provider",
 *   name: "MyContext",
 *   defaultValue: { foo: "bar" },
 * });
 *
 * const MyComponent = () => {
 *   const context = useContext();
 *   return <div>{context.foo}</div>;
 * };
 *
 * const MyProvider = ({ children }) => {
 *   return <Provider value={{ foo: "baz" }}>{children}</Provider>;
 * };
 *
 * const App = () => {
 *   return (
 *     <MyProvider>
 *       <MyComponent />
 *     </MyProvider>
 *   );
 * };
 */
export function createContext<ContextType>(options: CreateContextOptions = {}) {
	const {
		strict = true,
		errorMessage = "useContext: `context` is undefined. Seems you forgot to wrap component within the Provider",
		name,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		defaultValue = undefined,
	} = options;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	const Context = React.createContext<ContextType | undefined>(defaultValue);

	Context.displayName = name;

	function useContext() {
		const context = React.use(Context);

		if (!context && strict) {
			const error = new Error(errorMessage);
			error.name = "ContextError";
			Error.captureStackTrace(error, useContext);
			throw error;
		}

		return context;
	}

	return [
		Context.Provider,
		useContext,
		Context,
	] as CreateContextReturn<ContextType>;
}
