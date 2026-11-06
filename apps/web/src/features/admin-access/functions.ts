import { identifyScope } from "@jwc/observability/scope";
import { clientIpOf } from "@jwc/security/rate-limit";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { enforceRateLimit } from "../../platform/server/security/rate-limit";
import { toResult } from "../../platform/server/server-fn";
import { MAX_EMAIL_LENGTH } from "../../platform/server/validation";
import { AdminSignupSchema } from "./domain/admin-input";
import {
	createInvite,
	recentInvites,
	signUpAdmin,
} from "./server/admin-access";
import { adminOnly } from "./server/admin-only";
import { audited, recentAdminActions } from "./server/audit";
import { currentAdminAccess } from "./server/session";

/**
 * 관리자 접근 기능의 서버 함수 경계 (세션, 초대, 가입, 감사 기록 조회).
 */

export const getAdminAccessFn = createServerFn({ method: "GET" }).handler(() =>
	currentAdminAccess(),
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
 * 입력 스키마가 형식·크기와 번호를 정규화하고, 가입 모듈이 허용 목록·초대·비밀번호 정책 거절을 처리한다.
 */
export const signUpAdminFn = createServerFn({ method: "POST" })
	.validator(AdminSignupSchema)
	.handler(({ data }) =>
		toResult("admin.signUp", async () => {
			const now = Date.now();
			const headers = getRequestHeaders();
			await enforceRateLimit("admin_auth", clientIpOf(headers), now);
			const admin = await signUpAdmin(data, headers, now);
			identifyScope(admin.userId);
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
