import type { Form } from "@jwc/payload/payload-types";
import type { FieldHook } from "payload";

export const formatFormUserFullName: FieldHook<Form> = ({ data }) => {
  return `${data?.name} (${data?.department ?? "미입력"} - ${data?.age ?? "미입력"})`;
};
