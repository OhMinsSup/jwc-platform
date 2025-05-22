import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";

import { createORPCContext } from "./orpc";
import { router as appRouter } from "./router";

/**
 * Export type definition of API
 */
type AppRouter = typeof appRouter;

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 **/
type RouterInputs = InferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 **/
type RouterOutputs = InferRouterOutputs<AppRouter>;

export { appRouter, createORPCContext };
export type { AppRouter, RouterInputs, RouterOutputs };
