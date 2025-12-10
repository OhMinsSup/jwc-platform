import { v } from "convex/values";
import { query } from "./_generated/server";
import { authComponent } from "./auth";

export const getCurrentUser = query({
	args: {},
	returns: v.any(),
	async handler(ctx, _args) {
		return await authComponent.getAuthUser(ctx);
	},
});
