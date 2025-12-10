import { setDayjsLocale, setDayjsPlugin } from "@jwc/utils/date";
import type { ConfigType } from "dayjs";
import { dayjs } from "./config";

setDayjsLocale();
setDayjsPlugin();

export const getDateFormat = (date?: ConfigType) =>
	dayjs(date).tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
