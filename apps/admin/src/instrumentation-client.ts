import { initializeSentry } from "@jwc/observability/client";
import * as Sentry from "@sentry/nextjs";

initializeSentry();

// This export will instrument router navigations, and is only relevant if you enable tracing.
// `captureRouterTransitionStart` is available from SDK version 9.12.0 onwards
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
