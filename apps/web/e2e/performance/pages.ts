import { createHmac } from "node:crypto";

import type { BrowserContext } from "@playwright/test";

import { E2E_FORM } from "../fixture";
import {
	PERFORMANCE_ACCOUNTS,
	PERFORMANCE_ORIGIN,
	PERFORMANCE_SECRET,
} from "./settings";

export type Interaction =
	| "home"
	| "form"
	| "review"
	| "done"
	| "submission"
	| "text"
	| "recovery"
	| "forms"
	| "admins"
	| "editor"
	| "preview"
	| "responses"
	| "not-found";

export interface PerformancePage {
	name: string;
	path: string;
	heading: string;
	status?: number;
	account?: keyof typeof PERFORMANCE_ACCOUNTS;
	interaction: Interaction;
}

const FORM = `/f/${E2E_FORM.slug}`;
const EDITOR = `/admin/forms/${E2E_FORM.id}`;

type PageTemplate = Omit<PerformancePage, "path"> & {
	path: string | ((submissionPath: string) => string);
};

const PAGE_TEMPLATES: PageTemplate[] = [
	{
		name: "home",
		path: "/",
		heading: "신청은 여기에서",
		interaction: "home",
	},
	{ name: "form", path: FORM, heading: "기본 정보", interaction: "form" },
	{
		name: "review",
		path: `${FORM}?step=review`,
		heading: "신청 내용 확인",
		interaction: "review",
	},
	{
		name: "done",
		path: (submissionPath) =>
			`${FORM}/done?id=${encodeURIComponent(submissionPath.split("/").at(-1) ?? "")}`,
		heading: "신청이 완료되었습니다",
		interaction: "done",
	},
	{
		name: "submission",
		path: (submissionPath) => submissionPath,
		heading: "신청 내역",
		interaction: "submission",
	},
	{
		name: "login",
		path: "/admin/login",
		heading: "관리자 로그인",
		interaction: "text",
	},
	{
		name: "signup",
		path: "/admin/signup",
		heading: "관리자 가입",
		interaction: "text",
	},
	{
		name: "verify-phone",
		path: "/admin/verify-phone",
		heading: "휴대전화 인증",
		interaction: "text",
	},
	{
		name: "setup-two-factor",
		path: "/admin/setup-two-factor",
		heading: "2단계 인증 등록",
		account: "setup",
		interaction: "text",
	},
	{
		name: "two-factor",
		path: "/admin/two-factor",
		heading: "2단계 인증",
		interaction: "recovery",
	},
	{
		name: "forgot-password",
		path: "/admin/forgot-password",
		heading: "비밀번호 재설정",
		interaction: "text",
	},
	{
		name: "admin-forms",
		path: "/admin",
		heading: "폼",
		account: "ready",
		interaction: "forms",
	},
	{
		name: "admin-access",
		path: "/admin/admins",
		heading: "관리자",
		account: "ready",
		interaction: "admins",
	},
	{
		name: "editor",
		path: EDITOR,
		heading: "E2E 신청서",
		account: "ready",
		interaction: "editor",
	},
	{
		name: "preview",
		path: `${EDITOR}/preview`,
		heading: "E2E 신청서",
		account: "ready",
		interaction: "preview",
	},
	{
		name: "responses",
		path: `${EDITOR}/submissions`,
		heading: "E2E 신청서",
		account: "ready",
		interaction: "responses",
	},
	{
		name: "form-settings",
		path: `${EDITOR}/settings`,
		heading: "E2E 신청서",
		account: "ready",
		interaction: "text",
	},
	{
		name: "not-found",
		path: "/performance-missing-page",
		heading: "페이지를 찾을 수 없습니다",
		status: 404,
		interaction: "not-found",
	},
];

export function performancePages(submissionPath: string): PerformancePage[] {
	return PAGE_TEMPLATES.map(({ path, ...page }) => ({
		...page,
		path: typeof path === "function" ? path(submissionPath) : path,
	}));
}

export async function authenticate(
	context: BrowserContext,
	account: keyof typeof PERFORMANCE_ACCOUNTS,
) {
	const { token } = PERFORMANCE_ACCOUNTS[account];
	const signature = createHmac("sha256", PERFORMANCE_SECRET)
		.update(token)
		.digest("base64");
	await context.addCookies([
		{
			name: "better-auth.session_token",
			value: encodeURIComponent(`${token}.${signature}`),
			url: PERFORMANCE_ORIGIN,
			httpOnly: true,
			sameSite: "Lax",
		},
	]);
}
