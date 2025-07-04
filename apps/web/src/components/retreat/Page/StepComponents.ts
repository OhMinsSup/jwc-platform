import React, { memo, useMemo } from "react";
import type { LazyComponentProps } from "~/atoms/stepConfig";
import { STEP_CONFIG, STEP_DEFINITIONS } from "~/atoms/stepConfig";

// Lazy component cache for better performance
const lazyComponentCache = new Map<
	string,
	React.LazyExoticComponent<React.ComponentType<LazyComponentProps>>
>();

// Create lazy components with caching
const createLazyComponent = (
	stepDefinition: (typeof STEP_DEFINITIONS)[number]
) => {
	const cached = lazyComponentCache.get(stepDefinition.key);
	if (cached) {
		return cached;
	}

	const LazyComponent = React.lazy(stepDefinition.component);
	lazyComponentCache.set(stepDefinition.key, LazyComponent);
	return LazyComponent;
};

// Generate component map from step definitions
export const STEP_COMPONENTS = STEP_DEFINITIONS.map((stepDef, index) => ({
	idx: index + 1,
	key: stepDef.key,
	name: stepDef.name,
	component: createLazyComponent(stepDef),
	metadata: stepDef.metadata,
}));

// Create optimized component map - memoized at module level
export const componentMap = Object.fromEntries(
	STEP_COMPONENTS.map(({ key, component }) => [key, component])
);

// Export step configuration for other components
export { STEP_CONFIG };

// Additional computed constants
export const TOTAL_STEP_COUNT = STEP_CONFIG.TOTAL_COUNT;
export const CONFIRM_STEP = STEP_CONFIG.CONFIRM_STEP;
export const COMPLETED_STEP = STEP_CONFIG.COMPLETED_STEP;
