import { formatAttendanceTime as fmt } from "@jwc/payload/helpers/format";
import type { Form } from "@jwc/payload/payload-types";
import type { FieldHook } from "payload";

export const formatAttendanceTime: FieldHook<Form> = ({
	data,
	operation,
	value,
}) => {
	if (operation === "read") {
		return fmt(value);
	}
	return value || "알수없음";
};
