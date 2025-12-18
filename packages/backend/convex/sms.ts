"use node";

/**
 * SMS 발송 액션
 *
 * Node.js 런타임에서 실행됨
 * - SMS 발송 (Workpool 사용)
 * - 단축 URL 생성
 */

import { decrypt, deriveKey, type EncryptedData } from "@jwc/utils/crypto";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { FEES, STAY_TYPE_LABELS } from "./lib/constants";
import {
	getSolapiClient,
	interpolateTemplate,
	MESSAGE_TEMPLATES,
} from "./lib/solapi";

/**
 * 온보딩 완료 환영 메시지 발송 액션
 * - onboardingId로 DB에서 데이터 조회
 * - 암호화된 이름/전화번호 복호화
 * - 단축 URL 생성
 * - SMS 발송
 */
export const sendOnboardingWelcome = internalAction({
	args: {
		onboardingId: v.id("onboarding"),
	},
	handler: async (ctx, args) => {
		try {
			const AES_KEY = process.env.AES_KEY;
			if (!AES_KEY) {
				throw new Error("AES_KEY is not configured in environment variables");
			}

			// DB에서 온보딩 데이터 조회 (internal query 사용)
			const onboarding = await ctx.runQuery(
				internal.onboarding.getByIdInternal,
				{
					id: args.onboardingId,
				}
			);

			if (!onboarding) {
				throw new Error(`Onboarding not found: ${args.onboardingId}`);
			}

			const key = await deriveKey(AES_KEY);

			// 암호화된 데이터 복호화
			const phone = await decrypt(
				onboarding.phone as unknown as EncryptedData,
				key
			);
			const name = onboarding.name;

			// 템플릿 메시지 생성
			const template = MESSAGE_TEMPLATES["onboarding-welcome"];
			if (!template) {
				throw new Error("Template not found: onboarding-welcome");
			}

			const stayTypeLabel =
				STAY_TYPE_LABELS[
					onboarding.stayType as keyof typeof STAY_TYPE_LABELS
				] ?? onboarding.stayType;

			// 사이트 URL 생성
			const baseUrl = process.env.SITE_URL ?? "https://jjuliy.vercel.app";
			const targetUrl = `${baseUrl}/application/${args.onboardingId}`;

			// 단축 URL 생성
			const shortUrlResult = await ctx.runMutation(
				internal.shortUrl.createInternal,
				{
					targetUrl,
					metadata: {
						type: "onboarding-welcome",
						onboardingId: args.onboardingId,
					},
				}
			);

			// 단축 URL (예: https://jwc.vercel.app/s/abc123)
			const siteUrl = `${baseUrl}/s/${shortUrlResult.code}`;

			const text = interpolateTemplate(template.text, {
				name,
				stayType: stayTypeLabel,
				siteUrl,
			});

			// SMS 발송
			const client = getSolapiClient();
			const result = await client.send({
				to: phone,
				text,
			});

			return result;
		} catch (error) {
			console.error("[SMS] Error in sendOnboardingWelcome:", error);
			throw error;
		}
	},
});

/**
 * 온보딩 데이터 업데이트 메시지 발송 액션
 * - onboardingId로 DB에서 데이터 조회
 * - 암호화된 이름/전화번호 복호화
 * - 단축 URL 생성
 * - SMS 발송
 */
export const sendOnboardingUpdate = internalAction({
	args: {
		onboardingId: v.id("onboarding"),
	},
	handler: async (ctx, args) => {
		try {
			const AES_KEY = process.env.AES_KEY;
			if (!AES_KEY) {
				throw new Error("AES_KEY is not configured in environment variables");
			}

			// DB에서 온보딩 데이터 조회 (internal query 사용)
			const onboarding = await ctx.runQuery(
				internal.onboarding.getByIdInternal,
				{
					id: args.onboardingId,
				}
			);

			if (!onboarding) {
				throw new Error(`Onboarding not found: ${args.onboardingId}`);
			}

			const key = await deriveKey(AES_KEY);

			// 암호화된 데이터 복호화
			const phone = await decrypt(
				onboarding.phone as unknown as EncryptedData,
				key
			);
			const name = onboarding.name;

			// 템플릿 메시지 생성
			const template = MESSAGE_TEMPLATES["onboarding-update"];
			if (!template) {
				throw new Error("Template not found: onboarding-update");
			}

			const stayTypeLabel =
				STAY_TYPE_LABELS[
					onboarding.stayType as keyof typeof STAY_TYPE_LABELS
				] ?? onboarding.stayType;

			const amount = FEES[onboarding.stayType] ?? 0;
			const accountInfo = process.env.VITE_PAID_ACCOUNT_NUMBER ?? "";

			// 사이트 URL 생성
			const baseUrl = process.env.SITE_URL ?? "https://jjuliy.vercel.app";
			const targetUrl = `${baseUrl}/application/${args.onboardingId}`;

			// 단축 URL 생성
			const shortUrlResult = await ctx.runMutation(
				internal.shortUrl.createInternal,
				{
					targetUrl,
					metadata: {
						type: "onboarding-update",
						onboardingId: args.onboardingId,
					},
				}
			);

			// 단축 URL (예: https://jwc.vercel.app/s/abc123)
			const siteUrl = `${baseUrl}/s/${shortUrlResult.code}`;

			const text = interpolateTemplate(template.text, {
				name,
				stayType: stayTypeLabel,
				amount: amount.toLocaleString(),
				accountInfo,
				siteUrl,
			});

			// SMS 발송
			const client = getSolapiClient();
			const result = await client.send({
				to: phone,
				text,
			});

			return result;
		} catch (error) {
			console.error("[SMS] Error in sendOnboardingUpdate:", error);
			throw error;
		}
	},
});

/**
 * 미입금 알림 SMS 발송 액션
 * - 미입금자 중에서 아직 3회 이하로 알림을 받지 않은 신청서 조회
 * - 첫 1회는 신청일로부터 3일 후, 첫번째 발송 이후로는 3일 간격으로 발송, ...
 * - 3일에 한번씩 미입금 알림 SMS 발송
 * - 암호화된 이름/전화번호 복호화
 * - 단축 URL 생성
 * - SMS 발송
 * - 발송 상태 업데이트
 */
export const sendPaymentReminder = internalAction({
	args: {},
	handler: async (ctx) => {
		try {
			const AES_KEY = process.env.AES_KEY;
			if (!AES_KEY) {
				throw new Error("AES_KEY is not configured in environment variables");
			}

			// 1. 대상자 조회
			const targets = await ctx.runQuery(
				internal.onboarding.getUnpaidForReminder
			);
			if (targets.length === 0) {
				return { count: 0 };
			}

			const key = await deriveKey(AES_KEY);
			const client = getSolapiClient();
			const baseUrl = process.env.SITE_URL ?? "https://jjuliy.vercel.app";
			const template = MESSAGE_TEMPLATES["payment-reminder"];

			if (!template) {
				throw new Error("Template not found: payment-reminder");
			}

			let successCount = 0;

			// 2. 각 대상자에게 SMS 발송
			for (const user of targets) {
				try {
					// 복호화
					const phone = await decrypt(
						user.phone as unknown as EncryptedData,
						key
					);

					// 단축 URL 생성
					const targetUrl = `${baseUrl}/application/${user._id}`;
					const shortUrlResult = await ctx.runMutation(
						internal.shortUrl.createInternal,
						{
							targetUrl,
							metadata: {
								type: "payment-reminder",
								onboardingId: user._id,
							},
						}
					);
					const siteUrl = `${baseUrl}/s/${shortUrlResult.code}`;

					const stayTypeLabel =
						STAY_TYPE_LABELS[user.stayType as keyof typeof STAY_TYPE_LABELS] ??
						user.stayType;

					const amount = FEES[user.stayType] ?? 0;
					const accountInfo = process.env.VITE_PAID_ACCOUNT_NUMBER ?? "";

					const text = interpolateTemplate(template.text, {
						name: user.name,
						stayType: stayTypeLabel,
						amount: amount.toLocaleString(),
						accountInfo,
						siteUrl,
					});

					// SMS 발송
					await client.send({
						to: phone,
						text,
					});

					// 상태 업데이트
					await ctx.runMutation(
						internal.onboarding.updatePaymentReminderStatus,
						{
							onboardingId: user._id,
						}
					);

					successCount += 1;
				} catch (err) {
					console.error(
						`[SMS] Failed to send payment reminder to ${user._id}:`,
						err
					);
				}
			}

			return { count: successCount };
		} catch (error) {
			console.error("[SMS] Error in sendPaymentReminder:", error);
			throw error;
		}
	},
});
