import type { CollectionConfig } from "payload";
import { admins } from "@jwc/payload/access/admins";
import { authenticated } from "@jwc/payload/access/authenticated";
import { ensureFirstUserIsAdmin } from "@jwc/payload/hooks/ensureFirstUserIsAdmin";

export const Users: CollectionConfig<"users"> = {
  access: {
    admin: admins,
    read: authenticated,
    update: admins,
  },
  admin: {
    group: "사이트 관리",
    useAsTitle: "email",
  },
  labels: {
    singular: {
      en: "User",
      ko: "유저",
    },
    plural: {
      en: "Users",
      ko: "유저 목록",
    },
  },
  auth: true,
  fields: [
    {
      // override default email field to add a custom validate function to prevent users from changing the login email
      name: "email",
      type: "email",
      label: {
        en: "Email",
        ko: "이메일",
      },
      required: true,
      unique: true,
    },
    {
      name: "roles",
      label: {
        en: "Roles",
        ko: "권한",
      },
      access: {
        create: admins,
        read: admins,
        update: admins,
      },
      defaultValue: ["user"],
      hasMany: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: [
        {
          label: "admin",
          value: "admin",
        },
        {
          label: "user",
          value: "user",
        },
      ],
      type: "select",
    },
  ],
  slug: "users",
};
