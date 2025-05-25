import { AES_KEY } from "@jwc/payload/configurePayload";
import { decrypt } from "@jwc/payload/helpers/crypto";
import type { Form } from "@jwc/payload/payload-types";
import type { FieldHook } from "payload";

export const decryptFieldValue: FieldHook<Form> = async ({
	operation,
	req,
	value,
}) => {
	if (operation === "read" && value) return decrypt(value, AES_KEY);
	return value;
};
