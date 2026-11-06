import type { AdminRegistration } from "./admin-directory";
import { normalizeEmail } from "./admin-signup";

export interface AdminIdentity {
	email: string;
	id: string;
	name: string;
}

interface AuthUser extends AdminIdentity {
	phoneNumber?: string | null;
	phoneNumberVerified?: boolean | null;
	twoFactorEnabled?: boolean | null;
}

export type AdminAccessDecision =
	| { kind: "signed_out" }
	| { kind: "blocked" }
	| { kind: "verify_phone" }
	| { kind: "setup_two_factor" }
	| { kind: "ready"; admin: AdminIdentity };

export function decideAdminAccess(facts: {
	user: AuthUser | null;
	registration: AdminRegistration | null;
}): AdminAccessDecision {
	const { user, registration } = facts;
	if (!user) {
		return { kind: "signed_out" };
	}
	if (!registration || registration.email !== normalizeEmail(user.email)) {
		return { kind: "blocked" };
	}
	if (!hasVerifiedAdminPhone(user, registration.phoneNumber)) {
		return { kind: "verify_phone" };
	}
	if (user.twoFactorEnabled !== true) {
		return { kind: "setup_two_factor" };
	}
	return {
		kind: "ready",
		admin: { id: user.id, email: user.email, name: user.name },
	};
}

export function hasVerifiedAdminPhone(
	user: unknown,
	expectedPhone: string | null,
): boolean {
	if (user === null || typeof user !== "object" || !expectedPhone) {
		return false;
	}
	if (!("phoneNumberVerified" in user && "phoneNumber" in user)) {
		return false;
	}
	return (
		user.phoneNumberVerified === true && user.phoneNumber === expectedPhone
	);
}
