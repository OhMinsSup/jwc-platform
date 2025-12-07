import betterAuth from "@convex-dev/better-auth/convex.config";
import workpool from "@convex-dev/workpool/convex.config";
import { setDayjsLocale, setDayjsPlugin } from "@jwc/utils/date";
import { defineApp } from "convex/server";

setDayjsLocale();
setDayjsPlugin();

const app = defineApp();
app.use(betterAuth);
app.use(workpool, { name: "smsWorkpool" });
app.use(workpool, { name: "spreadsheetWorkpool" });

export default app;
