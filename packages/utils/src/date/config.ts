import _dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/ko";

const plugin = [utc, timezone];

export function setDayjsLocale(locale = "ko") {
	_dayjs.locale(locale);
}

export function setDayjsPlugin() {
	for (const p of plugin) {
		_dayjs.extend(p);
	}
}

export const dayjs = _dayjs;
