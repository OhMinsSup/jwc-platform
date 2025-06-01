import { formatAttendanceDay as fmd } from "@jwc/payload/helpers/format";
import type { Form } from "@jwc/payload/payload-types";
import type { FieldHook } from "payload";

export const formatAttendanceDay: FieldHook<Form> = ({
	data,
	operation,
	value,
}) => {
	if (operation === "read") {
		return fmd(value);
	}
	return value || "알수없음";
};
