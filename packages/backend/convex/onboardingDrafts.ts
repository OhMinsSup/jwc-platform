import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
 * 전화번호 해시로 임시저장 데이터 조회
 */
export const getByPhoneHash = query({
	args: {
		phoneHash: v.string(),
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("onboardingDrafts")
			.withIndex("by_phoneHash", (q) => q.eq("phoneHash", args.phoneHash))
			.first(),
});

/**
 * 모든 임시저장 데이터 조회 (관리자용)
 */
export const getAll = query({
	handler: async (ctx) =>
		await ctx.db
			.query("onboardingDrafts")
			.withIndex("by_lastUpdatedAt")
			.order("desc")
			.collect(),
});

/**
 * 오래된 임시저장 데이터 조회 (정리용)
 * - 기본 7일 이상 된 데이터
 */
export const getStale = query({
	args: {
		olderThanDays: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const days = args.olderThanDays ?? 7;
		const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

		return await ctx.db
			.query("onboardingDrafts")
			.withIndex("by_lastUpdatedAt")
			.filter((q) => q.lt(q.field("lastUpdatedAt"), cutoffTime))
			.collect();
	},
});

/**
 * 임시저장 데이터 저장/업데이트 (Upsert)
 * - phoneHash 기준으로 기존 데이터가 있으면 업데이트, 없으면 생성
 */
export const upsert = mutation({
	args: {
		phoneHash: v.string(),
		currentStep: v.string(),

		// 폼 데이터 (모두 optional)
		encryptedName: v.optional(v.string()),
		encryptedPhone: v.optional(v.string()),
		gender: v.optional(genderValidator),
		department: v.optional(departmentValidator),
		ageGroup: v.optional(v.string()),
		stayType: v.optional(stayTypeValidator),
		attendanceDate: v.optional(v.string()),
		pickupTimeDescription: v.optional(v.string()),
		tfTeam: v.optional(tfTeamValidator),
		canProvideRide: v.optional(v.boolean()),
		rideDetails: v.optional(v.string()),
		tshirtSize: v.optional(tshirtSizeValidator),
	},
	handler: async (ctx, args) => {
		const { phoneHash, ...formData } = args;

		// 기존 draft 조회
		const existingDraft = await ctx.db
			.query("onboardingDrafts")
			.withIndex("by_phoneHash", (q) => q.eq("phoneHash", phoneHash))
			.first();

		const now = Date.now();

		if (existingDraft) {
			// 기존 데이터 업데이트
			await ctx.db.patch(existingDraft._id, {
				...formData,
				lastUpdatedAt: now,
			});
			return existingDraft._id;
		}

		// 새로 생성
		return await ctx.db.insert("onboardingDrafts", {
			phoneHash,
			...formData,
			lastUpdatedAt: now,
		});
	},
});

/**
 * 임시저장 데이터 삭제
 * - 최종 제출 완료 후 호출
 */
export const remove = mutation({
	args: {
		phoneHash: v.string(),
	},
	handler: async (ctx, args) => {
		const draft = await ctx.db
			.query("onboardingDrafts")
			.withIndex("by_phoneHash", (q) => q.eq("phoneHash", args.phoneHash))
			.first();

		if (draft) {
			await ctx.db.delete(draft._id);
			return true;
		}
		return false;
	},
});

/**
 * ID로 임시저장 데이터 삭제
 */
export const removeById = mutation({
	args: {
		id: v.id("onboardingDrafts"),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
		return true;
	},
});

/**
 * 오래된 임시저장 데이터 일괄 삭제 (관리자용)
 * - 기본 7일 이상 된 데이터 삭제
 */
export const removeStale = mutation({
	args: {
		olderThanDays: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const days = args.olderThanDays ?? 7;
		const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

		const staleDrafts = await ctx.db
			.query("onboardingDrafts")
			.withIndex("by_lastUpdatedAt")
			.filter((q) => q.lt(q.field("lastUpdatedAt"), cutoffTime))
			.collect();

		for (const draft of staleDrafts) {
			await ctx.db.delete(draft._id);
		}

		return staleDrafts.length;
	},
});
