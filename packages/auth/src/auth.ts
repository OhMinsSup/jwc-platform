import { betterAuth } from "better-auth";
import { authConfig } from "./config";

export const auth = betterAuth(authConfig);

export type Auth = typeof auth;
