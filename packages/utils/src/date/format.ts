import type { ConfigType } from "dayjs";
import { dayjs } from "./config";

export const getDateFormat = (date?: ConfigType) => {
	return dayjs(date).tz("Asia/Seoul").format("YYYY-MM-DD_HH-mm-ss");
};
