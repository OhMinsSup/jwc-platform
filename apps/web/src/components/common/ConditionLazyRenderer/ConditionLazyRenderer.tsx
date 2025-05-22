import type React from "react";
import { Suspense } from "react";
import {
	BaseErrorFallback,
	ErrorBoundary,
} from "~/components/common/ErrorBoundary";
import { FormSkeleton } from "~/components/forms/FormSkeleton";

export interface LazyComponentProps {
	idx: number;
	componentKey: string;
}

interface ConditionLazyRendererProps {
	conditions: { [key: string]: boolean };
	componentMap: {
		[key: string]: React.LazyExoticComponent<
			React.ComponentType<LazyComponentProps>
		>;
	};
}

export default function ConditionLazyRenderer({
	conditions,
	componentMap,
}: ConditionLazyRendererProps) {
	return (
		<>
			{Object.entries(conditions).map(([key, shouldRender], idx) => {
				if (!shouldRender || !componentMap[key]) return null;

				const LazyComponent = componentMap[key];
				return (
					<ErrorBoundary fallback={<BaseErrorFallback />} key={key}>
						<Suspense fallback={<FormSkeleton />}>
							<LazyComponent idx={idx + 1} componentKey={key} />
						</Suspense>
					</ErrorBoundary>
				);
			})}
		</>
	);
}
