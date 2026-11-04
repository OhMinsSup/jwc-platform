import { clientIpOf } from "@jwc/security/rate-limit";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { enforceRateLimit } from "../../platform/server/security/rate-limit";
import { toResult } from "../../platform/server/server-fn";
import { MAX_EMAIL_LENGTH } from "../../platform/server/validation";
import {
	createInvite,
	recentInvites,
	signUpAdmin,
} from "./server/admin-access";
import { adminOnly } from "./server/admin-only";
import { audited, recentAdminActions } from "./server/audit";
import { currentAdmin } from "./server/session";

/**
 * 관리자 접근 기능의 서버 함수 경계 (세션, 초대, 가입, 감사 기록 조회).
 */

const MAX_NAME_LENGTH = 50;
/** Better Auth 기본 최대 비밀번호 길이 */
const MAX_PASSWORD_LENGTH = 128;
const MAX_INVITE_CODE_LENGTH = 64;

export const getAdminSessionFn = createServerFn({ method: "GET" }).handler(() =>
	currentAdmin(),
);

/** 관리자 초대 발급. 원문 코드는 이 응답에서 한 번만 돌려준다 */
export const createInviteFn = createServerFn({ method: "POST" })
	.middleware([adminOnly])
	.validator(z.object({ email: z.string().trim().max(MAX_EMAIL_LENGTH) }))
	.handler(({ data, context }) =>
		toResult("admin.createInvite", () =>
			audited(
				context.admin,
				(invite) => ({
					action: "admin.invite_created",
					targetType: "invite",
					targetId: invite.id,
					detail: { expiresAt: invite.expiresAt },
				}),
				() => createInvite(context.admin, data.email, Date.now()),
			),
		),
	);

export const listInvitesFn = createServerFn({ method: "GET" })
	.middleware([adminOnly])
	.handler(() =>
		toResult("admin.listInvites", () => recentInvites(Date.now())),
	);

export const listAuditFn = createServerFn({ method: "GET" })
	.middleware([adminOnly])
	.handler(() => toResult("admin.listAudit", () => recentAdminActions()));

/**
 * 공개 관리자 가입 경계 (로그인 전이라 adminOnly가 없다).
 * 경계에서는 길이만 제한하고, 형식/정책 판단은 서비스가 한다 — 어떤 거절이든 같은 문장으로 돌려주기 위해.
 */
export const signUpAdminFn = createServerFn({ method: "POST" })
	.validator(
		z.object({
			name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
			email: z.string().trim().max(MAX_EMAIL_LENGTH),
			password: z.string().max(MAX_PASSWORD_LENGTH),
			inviteCode: z.string().trim().max(MAX_INVITE_CODE_LENGTH).optional(),
		}),
	)
	.handler(({ data }) =>
		toResult("admin.signUp", async () => {
			const now = Date.now();
			const headers = getRequestHeaders();
			await enforceRateLimit("admin_auth", clientIpOf(headers), now);
			const admin = await signUpAdmin(data, headers, now);
			// 가입한 본인이 행위자다 (가입 전에는 세션이 없다)
			await audited(
				{ id: admin.userId },
				() => ({
					action: "admin.signed_up",
					targetType: "user",
					targetId: admin.userId,
					detail: { path: admin.path, inviteId: admin.inviteId },
				}),
				() => Promise.resolve(admin),
			);
			return { path: admin.path };
		}),
	);
