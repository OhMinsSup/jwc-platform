import type { User } from "@jwc/payload/payload-types";
import type { FieldAccess } from "payload";
import { checkRole } from "@jwc/payload/access/checkRole";

export const admins: FieldAccess = ({ req: { user } }) => {
  return checkRole(["admin"], user as unknown as User);
};
