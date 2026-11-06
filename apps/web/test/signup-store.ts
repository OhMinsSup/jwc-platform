import type { SignupInvites } from "../src/features/admin-access/server/admin-signup";

interface Invite {
	id: string;
	email: string;
	codeHash: string;
	expiresAt: number;
	usedAt: number | null;
}

export function signupStore(countUsers: () => Promise<number>) {
	const invites: Invite[] = [];
	const repository: SignupInvites = {
		countUsers,
		claim: (input) => {
			const invite = invites.find(
				(row) =>
					row.codeHash === input.codeHash &&
					row.email === input.email &&
					row.usedAt === null &&
					row.expiresAt > input.now,
			);
			if (!invite) {
				return Promise.resolve(null);
			}
			invite.usedAt = input.now;
			return Promise.resolve(invite.id);
		},
		release: (id) => {
			const invite = invites.find((row) => row.id === id);
			if (invite) {
				invite.usedAt = null;
			}
			return Promise.resolve();
		},
	};
	return {
		repository,
		addInvite: (input: Omit<Invite, "id" | "usedAt">) => {
			const id = `test-invite-${invites.length}`;
			invites.push({ ...input, id, usedAt: null });
			return id;
		},
	};
}
