import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { totp } from "../test/totp";
import { E2E_ADMIN, adminSeedSql } from "./auth-fixture";
import { executeE2ESql } from "./database";

async function open(page: Page, path: string) {
	await page.goto(path);
	await page.waitForLoadState("networkidle");
}

async function login(page: Page) {
	await open(page, "/admin/login");
	await page.getByLabel("이메일", { exact: true }).fill(E2E_ADMIN.email);
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
