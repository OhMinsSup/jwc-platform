import {
	initializeSentry,
	onRequestErrorSentry,
} from "@jwc/observability/instrumentation";
import type { Instrumentation } from "next";

export const register = initializeSentry();

export const onRequestError: Instrumentation.onRequestError =
	onRequestErrorSentry;
