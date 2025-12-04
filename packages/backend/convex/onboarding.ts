import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================
// 공통 Validator 정의
// ============================================================

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

// ============================================================
// Query 함수
// ============================================================

/**
 * 모든 수련회 신청서 조회
 */
export const getAll = query({
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
 * 부서별 수련회 신청서 조회
 */
export const getByDepartment = query({
	args: {
		department: departmentValidator,
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("onboarding")
			.withIndex("by_department", (q) => q.eq("department", args.department))
			.collect(),
});

/**
 * 회비 납입 여부로 조회
 */
export const getByPaymentStatus = query({
	args: {
		isPaid: v.boolean(),
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("onboarding")
			.withIndex("by_isPaid", (q) => q.eq("isPaid", args.isPaid))
			.collect(),
});

/**
 * 전화번호로 수련회 신청서 조회
 */
export const getByPhone = query({
	args: {
		phone: v.string(),
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("onboarding")
			.withIndex("by_phone", (q) => q.eq("phone", args.phone))
			.first(),
});

/**
 * 숙박 형태별 조회
 */
export const getByStayType = query({
	args: {
		stayType: stayTypeValidator,
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("onboarding")
			.withIndex("by_stayType", (q) => q.eq("stayType", args.stayType))
			.collect(),
});

// ============================================================
// Mutation 함수
// ============================================================

/**
 * 수련회 신청서 생성
 */
export const create = mutation({
	args: {
		// 기본 개인 정보
		name: v.string(),
		phone: v.string(),
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
		const newId = await ctx.db.insert("onboarding", {
			name: args.name,
			phone: args.phone,
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
		return await ctx.db.get(newId);
	},
});

/**
 * 수련회 신청서 Upsert (생성 또는 수정)
 * - 전화번호를 기준으로 기존 신청서가 있으면 수정, 없으면 생성
 */
export const upsert = mutation({
	args: {
		// 기본 개인 정보
		name: v.string(),
		phone: v.string(),
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
		// 전화번호로 기존 신청서 조회
		const existing = await ctx.db
			.query("onboarding")
			.withIndex("by_phone", (q) => q.eq("phone", args.phone))
			.first();

		if (existing) {
			// 기존 신청서가 있으면 수정 (회비 납입 상태는 유지)
			await ctx.db.patch(existing._id, {
				name: args.name,
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
			return { isNew: false, data: await ctx.db.get(existing._id) };
		}

		// 신규 생성
		const newId = await ctx.db.insert("onboarding", {
			name: args.name,
			phone: args.phone,
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
		return { isNew: true, data: await ctx.db.get(newId) };
	},
});

/**
 * 수련회 신청서 수정
 */
export const update = mutation({
	args: {
		id: v.id("onboarding"),

		// 모든 필드를 optional로 설정하여 부분 업데이트 지원
		name: v.optional(v.string()),
		phone: v.optional(v.string()),
		gender: v.optional(genderValidator),
		department: v.optional(departmentValidator),
		ageGroup: v.optional(v.string()),
		stayType: v.optional(stayTypeValidator),
		attendanceDate: v.optional(v.string()),
		pickupTimeDescription: v.optional(v.string()),
		isPaid: v.optional(v.boolean()),
		tfTeam: v.optional(tfTeamValidator),
		canProvideRide: v.optional(v.boolean()),
		rideDetails: v.optional(v.string()),
		tshirtSize: v.optional(tshirtSizeValidator),
	},
	handler: async (ctx, args) => {
		const { id, ...updateFields } = args;

		// undefined 값 제거
		const cleanedFields = Object.fromEntries(
			Object.entries(updateFields).filter(([, value]) => value !== undefined)
		);

		await ctx.db.patch(id, cleanedFields);
		return await ctx.db.get(id);
	},
});

/**
 * 회비 납입 상태 토글
 */
export const togglePaymentStatus = mutation({
	args: {
		id: v.id("onboarding"),
		isPaid: v.boolean(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, { isPaid: args.isPaid });
		return { success: true };
	},
});

/**
 * 수련회 신청서 삭제
 */
export const remove = mutation({
	args: {
		id: v.id("onboarding"),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
		return { success: true };
	},
});

/**
 * 여러 수련회 신청서 일괄 삭제
 */
export const bulkRemove = mutation({
	args: {
		ids: v.array(v.id("onboarding")),
	},
	handler: async (ctx, args) => {
		for (const id of args.ids) {
			await ctx.db.delete(id);
		}
		return { success: true, deletedCount: args.ids.length };
	},
});
