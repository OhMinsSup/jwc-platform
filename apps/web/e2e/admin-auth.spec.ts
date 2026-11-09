import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { totp } from "../test/totp";
import {
	E2E_ADMIN,
	adminSeedSql,
	endReadyAdminSessionSql,
	readyAdminSessionSql,
	signInReadyAdmin,
} from "./auth-fixture";
import { executeE2ESql } from "./database";

async function open(page: Page, path: string) {
	await page.goto(path);
	await page.waitForLoadState("networkidle");
}

async function login(page: Page, email = E2E_ADMIN.email) {
	await open(page, "/admin/login");
	await page.getByLabel("이메일", { exact: true }).fill(email);
	await page.getByLabel("비밀번호", { exact: true }).fill(E2E_ADMIN.password);
	await page.getByRole("button", { name: "로그인", exact: true }).click();
}

test.beforeEach(async () => {
	executeE2ESql(await adminSeedSql(Date.now()));
});

test("미인증 접근 거절 → SMS 인증 → TOTP 등록 → 다음 로그인 2단계 확인", async ({
	page,
}) => {
	await login(page);
	await expect(page).toHaveURL(/\/admin\/verify-phone$/u);
	await expect(
		page.getByRole("heading", { name: "휴대전화 인증" }),
	).toBeVisible();
	await page.getByLabel("가입 이메일", { exact: true }).fill(E2E_ADMIN.email);
	await page
		.getByLabel("휴대전화 번호", { exact: true })
		.fill(E2E_ADMIN.phoneNumber);
	await page.getByLabel("문자 인증번호", { exact: true }).fill(E2E_ADMIN.code);
	await page.getByRole("button", { name: "인증 완료", exact: true }).click();
	await expect(page).toHaveURL(/\/admin\/login$/u);
	await login(page);
	await expect(page).toHaveURL(/\/admin\/setup-two-factor$/u);
	await expect(
		page.getByRole("heading", { name: "2단계 인증 등록" }),
	).toBeVisible();
	await page.getByLabel("비밀번호", { exact: true }).fill(E2E_ADMIN.password);
	await expect(page.getByLabel("비밀번호", { exact: true })).toHaveValue(
		E2E_ADMIN.password,
	);
	await page.getByRole("button", { name: "인증 앱 등록 시작" }).click();
	await expect(
		page.getByRole("img", { name: "인증 앱 등록용 QR 코드" }),
	).toBeVisible();
	await page.getByText("QR 코드를 스캔할 수 없나요?").click();
	const secret = await page.getByTestId("totp-setup-key").textContent();
	if (!secret) {
		throw new Error("인증 앱 설정 키가 없습니다");
	}
	const uri = `otpauth://totp/test?secret=${encodeURIComponent(secret)}`;
	await page.getByLabel("인증 코드", { exact: true }).fill(totp(uri));
	await page.getByRole("button", { name: "등록 완료" }).click();
	await expect(
		page.getByRole("heading", { name: "복구 코드를 보관하세요" }),
	).toBeVisible();
	const recovery = await page
		.getByRole("list", { name: "복구 코드" })
		.getByRole("listitem")
		.first()
		.textContent();
	if (!recovery) {
		throw new Error("복구 코드가 없습니다");
	}
	await page.getByRole("button", { name: "코드를 보관했습니다" }).click();
	await expect(
		page.getByRole("heading", { name: "폼", exact: true }),
	).toBeVisible();
	await page.context().clearCookies();
	await login(page);
	await expect(page).toHaveURL(/\/admin\/two-factor$/u);
	await open(page, "/admin");
	await expect(page).toHaveURL(/\/admin\/login$/u);
	await login(page);
	await page
		.getByRole("button", { name: "인증 앱을 사용할 수 없나요?" })
		.click();
	await page.getByLabel("복구 코드", { exact: true }).fill(recovery);
	await page.getByRole("button", { name: "인증하고 로그인" }).click();
	await expect(
		page.getByRole("heading", { name: "폼", exact: true }),
	).toBeVisible();
});

test("허용되지 않은 이메일의 가입은 거절하고 관리 화면을 열지 않는다", async ({
	page,
}) => {
	await open(page, "/admin/signup");
	await page.getByLabel("이름", { exact: true }).fill("가입 테스트");
	await page.getByLabel("이메일", { exact: true }).fill("unknown@example.org");
	await page.getByLabel("비밀번호", { exact: true }).fill(E2E_ADMIN.password);
	await page.getByLabel("휴대전화 번호", { exact: true }).fill("01087654321");
	await page
		.getByRole("button", { name: "인증 문자 받기", exact: true })
		.click();
	await expect(page.getByRole("alert")).toContainText("인증할 수 없습니다");
	await expect(page).toHaveURL(/\/admin\/signup$/u);
});

test("비밀번호가 맞아도 허용되지 않은 관리자에게 접근 거절을 안내한다", async ({
	page,
}) => {
	const email = "unlisted@example.org";
	executeE2ESql(
		`UPDATE user SET email = '${email}' WHERE id = '${E2E_ADMIN.id}';`,
	);
	const signedIn = page.waitForResponse("**/api/auth/sign-in/email");
	await login(page, email);
	const response = await signedIn;
	expect(response.status()).toBe(200);
	await expect(page.getByRole("alert")).toContainText(
		"관리자 접근 권한이 없습니다",
	);
	await expect(page).toHaveURL(/\/admin\/login$/u);
	await expect(
		page.getByRole("button", { name: "로그인", exact: true }),
	).toBeEnabled();
});

test("로그인 성공 응답 뒤 세션이 없으면 쿠키와 접속 주소 확인을 안내한다", async ({
	page,
}) => {
	await page.route("**/api/auth/sign-in/email", (route) =>
		route.fulfill({
			json: {
				redirect: false,
				token: "e2e-only-session-not-persisted",
				user: { id: E2E_ADMIN.id, email: E2E_ADMIN.email },
			},
		}),
	);
	await login(page);
	await expect(page.getByRole("alert")).toContainText(
		"로그인 세션을 확인하지 못했습니다",
	);
	await expect(page).toHaveURL(/\/admin\/login$/u);
	await expect(
		page.getByRole("button", { name: "로그인", exact: true }),
	).toBeEnabled();
});

const SERVER_FN_REQUESTS = "/_serverFn/";

function menuLink(page: Page, name: string) {
	return page
		.getByRole("navigation", { name: "관리자 메뉴" })
		.getByRole("link", { name, exact: true });
}

async function openConsole(page: Page, baseURL: string | undefined) {
	await signInReadyAdmin(page.context(), baseURL ?? "");
	await page.goto("/admin");
	await page.waitForLoadState("networkidle");
	await expect(
		page.getByRole("heading", { name: "폼", exact: true }),
	).toBeVisible();
}

/**
 * 인증을 마친 관리자의 콘솔 동작. 허용 목록의 E2E 이메일이 하나라 같은 사용자를 쓰는 위 테스트와
 * 다른 파일로 나누면 병렬 worker끼리 사용자를 지우고 다시 넣어 서로 깨뜨린다. 그래서 이 파일에 둔다.
 */
test.describe("인증을 마친 관리자 콘솔", () => {
	test.beforeEach(() => {
		executeE2ESql(readyAdminSessionSql(Date.now()));
	});

	test("콘솔 화면 이동은 접근 확인을 다시 묻지 않고, 방금 본 화면은 다시 읽지 않는다", async ({
		page,
		baseURL,
	}) => {
		await openConsole(page, baseURL);
		const calls: string[] = [];
		page.on("request", (request) => {
			if (request.url().includes(SERVER_FN_REQUESTS)) {
				calls.push(request.url());
			}
		});
		await menuLink(page, "관리자").click();
		await expect(
			page.getByRole("heading", { name: "관리자", exact: true }),
		).toBeVisible();
		await page.waitForLoadState("networkidle");
		// 초대 목록 + 감사 기록 두 개만. 접근 확인(beforeLoad)은 첫 화면에서 확인한 결과를 쓴다
		expect(calls).toHaveLength(2);
		await menuLink(page, "폼").click();
		await expect(
			page.getByRole("heading", { name: "폼", exact: true }),
		).toBeVisible();
		await page.waitForLoadState("networkidle");
		// 30초 안에 돌아온 목록은 다시 읽지 않는다
		expect(calls).toHaveLength(2);
	});

	test("세션이 끝났으면 콘솔 화면 이동이 오류 화면 대신 로그인으로 보낸다", async ({
		page,
		baseURL,
	}) => {
		await openConsole(page, baseURL);
		executeE2ESql(endReadyAdminSessionSql);
		await menuLink(page, "관리자").click();
		await expect(page).toHaveURL(/\/admin\/login$/u);
		await expect(
			page.getByRole("button", { name: "로그인", exact: true }),
		).toBeVisible();
		await expect(page.getByText("문제가 발생했습니다")).toHaveCount(0);
	});
});
