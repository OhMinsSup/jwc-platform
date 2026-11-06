import { AsyncLocalStorage } from "node:async_hooks";

import { normalizeEmail } from "../domain/admin-signup";

const approvedSignup = new AsyncLocalStorage<{
	email: string;
	bootstrap: boolean;
	phoneNumber: string;
}>();

export function runApprovedSignup<T>(
	approval: { email: string; bootstrap: boolean; phoneNumber: string },
	run: () => Promise<T>,
): Promise<T> {
	return approvedSignup.run(
		{ ...approval, email: normalizeEmail(approval.email) },
		run,
	);
}

export function approvedSignupFor(
	email: string,
): { bootstrap: boolean; phoneNumber: string } | null {
	const approval = approvedSignup.getStore();
	return approval?.email === normalizeEmail(email) ? approval : null;
}

const phoneAction = new AsyncLocalStorage<boolean>();

export function runApprovedPhoneAction<T>(run: () => Promise<T>): Promise<T> {
	return phoneAction.run(true, run);
}

export function isApprovedPhoneAction(): boolean {
	return phoneAction.getStore() === true;
}
