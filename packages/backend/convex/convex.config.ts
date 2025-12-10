import betterAuth from "@convex-dev/better-auth/convex.config";
import crons from "@convex-dev/crons/convex.config.js";
import workpool from "@convex-dev/workpool/convex.config";
import { setDayjsLocale, setDayjsPlugin } from "@jwc/utils/date";
import { defineApp } from "convex/server";

setDayjsLocale();
setDayjsPlugin();

const app = defineApp();
app.use(betterAuth);
app.use(workpool, { name: "smsWorkpool" });
app.use(workpool, { name: "spreadsheetWorkpool" });
app.use(crons);

export default app;
