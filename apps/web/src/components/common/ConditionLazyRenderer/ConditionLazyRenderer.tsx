import type React from "react";
import { Suspense, memo, useMemo } from "react";
import {
	BaseErrorFallback,
	ErrorBoundary,
} from "~/components/common/ErrorBoundary";
import { FormSkeleton } from "~/components/forms/FormSkeleton";

export interface LazyComponentProps {
	idx: number;
	componentKey: string;
}

interface ComponentMapType {
	[key: string]: React.LazyExoticComponent<
		React.ComponentType<LazyComponentProps>
	>;
}

interface ConditionLazyRendererProps {
	conditions: Record<string, boolean>;
	componentMap: ComponentMapType;
}

// 개별 컴포넌트 렌더러 - 메모화로 불필요한 리렌더링 방지
const LazyComponentRenderer = memo<{
	componentKey: string;
	idx: number;
	LazyComponent: React.LazyExoticComponent<
		React.ComponentType<LazyComponentProps>
	>;
}>(({ componentKey, idx, LazyComponent }) => (
	<ErrorBoundary
		fallback={BaseErrorFallback}
		beforeCapture={(scope) => {
			scope.setTag("conditionLazyRendererKey", componentKey);
			scope.setTag("conditionLazyRendererIdx", idx);
		}}
	>
		<Suspense fallback={<FormSkeleton />}>
			<LazyComponent idx={idx} componentKey={componentKey} />
		</Suspense>
	</ErrorBoundary>
));

LazyComponentRenderer.displayName = "LazyComponentRenderer";

function ConditionLazyRenderer({
	conditions,
	componentMap,
}: ConditionLazyRendererProps) {
	// 활성화된 컴포넌트만 필터링하여 성능 최적화
	const activeComponents = useMemo(() => {
		return Object.entries(conditions)
			.filter(([key, shouldRender]) => {
				const component = componentMap[key];
				return shouldRender && component;
			})
			.map(([key], index) => {
				const LazyComponent = componentMap[key];
				if (!LazyComponent) {
					throw new Error(`Component not found for key: ${key}`);
				}
				return {
					key,
					idx: index + 1,
					LazyComponent,
				};
			});
	}, [conditions, componentMap]);

	// 활성화된 컴포넌트가 없는 경우 빈 Fragment 반환
	if (activeComponents.length === 0) {
		return null;
	}

	return (
		<>
			{activeComponents.map(({ key, idx, LazyComponent }) => (
				<LazyComponentRenderer
					key={key}
					componentKey={key}
					idx={idx}
					LazyComponent={LazyComponent}
				/>
			))}
		</>
	);
}

export default memo(ConditionLazyRenderer);
