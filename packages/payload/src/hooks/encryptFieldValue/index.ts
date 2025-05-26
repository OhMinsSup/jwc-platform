import { encrypt, secretKey } from "@jwc/payload/helpers/crypto";
import type { Form } from "@jwc/payload/payload-types";
import type { FieldHook } from "payload";

export const encryptFieldValue: FieldHook<Form> = async ({
	operation,
	req,
	value,
}) => {
	if ((operation === "create" || operation === "update") && value) {
		return encrypt(value, secretKey());
	}
	return value;
};
