import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { smsPool, spreadsheetPool } from "./lib/workpool";

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

/** 암호화된 데이터 구조 */
const encryptedDataValidator = v.object({
	ciphertext: v.string(),
	iv: v.string(),
});

/**
 * 모든 수련회 신청서 조회
 */
export const getAll = query({
	handler: async (ctx) => await ctx.db.query("onboarding").collect(),
});

/**
 * 모든 수련회 신청서 조회 (Internal)
 * - Node.js 액션에서 호출 가능
 */
export const getAllInternal = internalQuery({
	handler: async (ctx) => await ctx.db.query("onboarding").collect(),
});

/**
 * ID로 수련회 신청서 조회
 */
export const getById = query({
	args: {
		id: v.id("onboarding"),
	},
	handler: async (ctx, args) => await ctx.db.get(args.id),
});

/**
 * ID로 수련회 신청서 조회 (Internal)
 * - Node.js 액션에서 호출 가능
 */
export const getByIdInternal = internalQuery({
	args: {
		id: v.id("onboarding"),
	},
	handler: async (ctx, args) => await ctx.db.get(args.id),
});

/**
 * 전화번호 해시로 수련회 신청서 조회
 * - 클라이언트에서 해시를 계산해서 전달
 */
export const getByPhoneHash = query({
	args: {
		phoneHash: v.string(),
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("onboarding")
			.withIndex("by_phoneHash", (q) => q.eq("phoneHash", args.phoneHash))
			.first(),
});

/**
 * 수련회 신청서 Upsert Internal Mutation
 * - action에서 호출하는 내부 mutation
 */
export const upsertInternal = internalMutation({
	args: {
		// 암호화된 개인 정보
		encryptedName: encryptedDataValidator,
		encryptedPhone: encryptedDataValidator,
		phoneHash: v.string(),

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
	handler: async (ctx, args) => {
		// phoneHash로 기존 신청서 조회
		const existing = await ctx.db
			.query("onboarding")
			.withIndex("by_phoneHash", (q) => q.eq("phoneHash", args.phoneHash))
			.first();

		if (existing) {
			// 기존 신청서가 있으면 수정 (회비 납입 상태는 유지)
			await ctx.db.patch(existing._id, {
				name: args.encryptedName,
				phone: args.encryptedPhone,
				gender: args.gender,
				department: args.department,
				ageGroup: args.ageGroup,
				stayType: args.stayType,
				attendanceDate: args.attendanceDate,
				pickupTimeDescription: args.pickupTimeDescription,
				tfTeam: args.tfTeam,
				canProvideRide: args.canProvideRide,
				rideDetails: args.rideDetails,
				tshirtSize: args.tshirtSize,
			});

			await spreadsheetPool.enqueueAction(
				ctx,
				internal.spreadsheet.syncAllToGoogleSheets,
				{},
				{
					onComplete: internal.spreadsheetHandlers.onSpreadsheetSyncComplete,
					context: {
						type: "onboarding-sync",
						onboardingId: existing._id,
					},
				}
			);

			return { isNew: false, id: existing._id };
		}

		// 신규 생성
		const newId = await ctx.db.insert("onboarding", {
			name: args.encryptedName,
			phone: args.encryptedPhone,
			phoneHash: args.phoneHash,
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

		// 최초 생성 시 SMS 환영 메시지 발송 (Workpool 사용)
		await smsPool.enqueueAction(
			ctx,
			internal.sms.sendOnboardingWelcome,
			{ onboardingId: newId },
			{
				onComplete: internal.smsHandlers.onSmsComplete,
				context: {
					type: "onboarding-welcome",
					onboardingId: newId,
				},
			}
		);

		await spreadsheetPool.enqueueAction(
			ctx,
			internal.spreadsheet.syncAllToGoogleSheets,
			{},
			{
				onComplete: internal.spreadsheetHandlers.onSpreadsheetSyncComplete,
				context: {
					type: "onboarding-sync",
					onboardingId: newId,
				},
			}
		);

		return { isNew: true, id: newId };
	},
});

/**
 * 전화번호 해시로 수련회 신청서 조회 (Internal)
 */
export const getByPhoneHashInternal = internalQuery({
	args: {
		phoneHash: v.string(),
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("onboarding")
			.withIndex("by_phoneHash", (q) => q.eq("phoneHash", args.phoneHash))
			.first(),
});
