"use node";

/**
 * SMS 발송 액션
 *
 * Node.js 런타임에서 실행됨
 * - SMS 발송 (Workpool 사용)
 */

import {
	decryptPersonalInfo,
	deriveKey,
	stringToEncryptedData,
} from "@jwc/utils/crypto";
import { dayjs } from "@jwc/utils/date";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { STAY_TYPE_LABELS } from "./lib/constants";
import {
	getSolapiClient,
	interpolateTemplate,
	MESSAGE_TEMPLATES,
} from "./lib/solapi";

/**
 * 온보딩 완료 환영 메시지 발송 액션
 * - onboardingId로 DB에서 데이터 조회
 * - 암호화된 이름/전화번호 복호화
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
			const { name, phone } = await decryptPersonalInfo(
				stringToEncryptedData(onboarding.name),
				stringToEncryptedData(onboarding.phone),
				key
			);

			// 템플릿 메시지 생성
			const template = MESSAGE_TEMPLATES["onboarding-welcome"];
			if (!template) {
				throw new Error("Template not found: onboarding-welcome");
			}

			const stayTypeLabel =
				STAY_TYPE_LABELS[
					onboarding.stayType as keyof typeof STAY_TYPE_LABELS
				] ?? onboarding.stayType;

			// 참석 날짜/시간 정보 (부분참일 경우에만 표시)
			let attendanceInfo = "";
			if (onboarding.stayType !== "3nights4days" && onboarding.attendanceDate) {
				const _attendanceDate = onboarding.attendanceDate;
				const attendanceDate = _attendanceDate
					? dayjs(_attendanceDate).format("YYYY년 MM월 DD일 (ddd) HH:mm")
					: "";

				attendanceInfo = `⏰ 참석일: ${attendanceDate}\n`;
				if (onboarding.pickupTimeDescription) {
					attendanceInfo += `🚗 픽업시간: ${onboarding.pickupTimeDescription}\n`;
				}
			}

			// 사이트 URL (환경변수 또는 기본값)
			const siteUrl = `${process.env.SITE_URL}/application/${args.onboardingId}`;

			const text = interpolateTemplate(template.text, {
				name,
				stayType: stayTypeLabel,
				attendanceInfo,
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
