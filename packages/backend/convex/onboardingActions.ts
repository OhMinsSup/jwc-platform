"use node";

/**
 * 온보딩 액션
 *
 * Node.js 런타임에서 실행됨
 * - 개인정보 암호화 처리
 */

import { deriveKey, encryptPersonalInfo, hashPhone } from "@jwc/utils/crypto";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action } from "./_generated/server";

/** 성별 */
const genderValidator = v.union(v.literal("male"), v.literal("female"));

/** 소속 부서 */
const departmentValidator = v.union(
	v.literal("youth1"),
	v.literal("youth2"),
	v.literal("other")
);

/** 숙박 형태 */
const stayTypeValidator = v.union(
	v.literal("3nights4days"),
	v.literal("2nights3days"),
	v.literal("1night2days"),
	v.literal("dayTrip")
);

/** TF팀 */
const tfTeamValidator = v.union(
	v.literal("none"),
	v.literal("praise"),
	v.literal("program"),
	v.literal("media")
);

/** 티셔츠 사이즈 */
const tshirtSizeValidator = v.union(
	v.literal("s"),
	v.literal("m"),
	v.literal("l"),
	v.literal("xl"),
	v.literal("2xl"),
	v.literal("3xl")
);

/**
 * 수련회 신청서 Upsert (생성 또는 수정)
 * - 평문 이름/전화번호를 받아서 내부에서 암호화 처리
 * - phoneHash를 기준으로 기존 신청서가 있으면 수정, 없으면 생성
 * - 최초 생성 시 SMS 환영 메시지 발송
 */
export const upsert = action({
	args: {
		// 평문 개인 정보 (내부에서 암호화)
		name: v.string(),
		phone: v.string(),

		// 기본 정보
		gender: genderValidator,
		department: departmentValidator,
		ageGroup: v.string(),

		// 참석 정보
		stayType: stayTypeValidator,
		attendanceDate: v.optional(v.string()),
		pickupTimeDescription: v.optional(v.string()),

		// 회비 및 지원 정보
		isPaid: v.boolean(),
		tfTeam: v.optional(tfTeamValidator),
		canProvideRide: v.optional(v.boolean()),
		rideDetails: v.optional(v.string()),

		// 기타 정보
		tshirtSize: v.optional(tshirtSizeValidator),
	},
	handler: async (
		ctx,
		args
	): Promise<{ isNew: boolean; id: Id<"onboarding"> }> => {
		const AES_KEY = process.env.AES_KEY;
		if (!AES_KEY) {
			throw new Error("AES_KEY is not configured in environment variables");
		}

		// 개인정보 암호화
		const key = await deriveKey(AES_KEY);
		const { encryptedName, encryptedPhone, phoneHash } =
			await encryptPersonalInfo(args.name, args.phone, key);

		// Internal mutation 호출
		return ctx.runMutation(internal.onboarding.upsertInternal, {
			encryptedName,
			encryptedPhone,
			phoneHash,
			gender: args.gender,
			department: args.department,
			ageGroup: args.ageGroup,
			stayType: args.stayType,
			attendanceDate: args.attendanceDate,
			pickupTimeDescription: args.pickupTimeDescription,
			isPaid: args.isPaid,
			tfTeam: args.tfTeam,
			canProvideRide: args.canProvideRide,
			rideDetails: args.rideDetails,
			tshirtSize: args.tshirtSize,
		});
	},
});

/**
 * 전화번호로 신청서 조회 (Action)
 * - 평문 전화번호를 받아서 내부에서 해시 처리
 */
export const getByPhone = action({
	args: {
		phone: v.string(),
	},
	handler: async (ctx, args): Promise<Doc<"onboarding"> | null> => {
		const phoneHashValue = await hashPhone(args.phone);
		return ctx.runQuery(internal.onboarding.getByPhoneHashInternal, {
			phoneHash: phoneHashValue,
		});
	},
});

/** 복호화된 신청서 정보 */
export interface DecryptedOnboarding {
	_id: Id<"onboarding">;
	_creationTime: number;
	name: string;
	phone: string;
	gender: "male" | "female";
	department: "youth1" | "youth2" | "other";
	ageGroup: string;
	stayType: "3nights4days" | "2nights3days" | "1night2days" | "dayTrip";
	attendanceDate?: string;
	pickupTimeDescription?: string;
	isPaid: boolean;
	tfTeam?: "none" | "praise" | "program" | "media";
	canProvideRide?: boolean;
	rideDetails?: string;
	tshirtSize?: "s" | "m" | "l" | "xl" | "2xl" | "3xl";
}

/**
 * ID로 신청서 조회 (복호화 포함)
 * - 암호화된 이름/전화번호를 복호화하여 반환
 */
export const getByIdDecrypted = action({
	args: {
		id: v.id("onboarding"),
	},
	handler: async (ctx, args): Promise<DecryptedOnboarding | null> => {
		const AES_KEY = process.env.AES_KEY;
		if (!AES_KEY) {
			throw new Error("AES_KEY is not configured in environment variables");
		}

		const onboarding = await ctx.runQuery(internal.onboarding.getByIdInternal, {
			id: args.id,
		});

		if (!onboarding) {
			return null;
		}

		// 동적 import로 crypto 함수 가져오기
		const { deriveKey, decryptPersonalInfo, stringToEncryptedData } =
			await import("@jwc/utils/crypto");

		const key = await deriveKey(AES_KEY);
		const { name, phone } = await decryptPersonalInfo(
			stringToEncryptedData(onboarding.name),
			stringToEncryptedData(onboarding.phone),
			key
		);

		return {
			_id: onboarding._id,
			_creationTime: onboarding._creationTime,
			name,
			phone,
			gender: onboarding.gender,
			department: onboarding.department,
			ageGroup: onboarding.ageGroup,
			stayType: onboarding.stayType,
			attendanceDate: onboarding.attendanceDate,
			pickupTimeDescription: onboarding.pickupTimeDescription,
			isPaid: onboarding.isPaid,
			tfTeam: onboarding.tfTeam,
			canProvideRide: onboarding.canProvideRide,
			rideDetails: onboarding.rideDetails,
			tshirtSize: onboarding.tshirtSize,
		};
	},
});
