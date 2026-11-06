import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** 같은 출처의 /api/auth 를 사용 */
export const authClient = createAuthClient({ plugins: [twoFactorClient()] });
