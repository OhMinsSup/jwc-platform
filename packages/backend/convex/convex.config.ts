import betterAuth from "@convex-dev/better-auth/convex.config";
import workpool from "@convex-dev/workpool/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(betterAuth);
app.use(workpool, { name: "smsWorkpool" });

export default app;
