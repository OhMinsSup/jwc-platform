import { omit } from "@jwc/utils/common";
import { dayjs } from "@jwc/utils/date";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { parseKoreanDate, parseKoreanTime } from "./lib/dateUtils";
import { fieldUpdaters } from "./lib/onboardingHelpers";
import { smsPool, spreadsheetPool } from "./lib/workpool";

/**
 * 참석일자/시간 필드 업데이트를 위한 헬퍼 함수
 */
function buildAttendanceDateTime(
	existingDate: string | undefined,
	field: "참석일자" | "참석시간",
	value: string
): { success: true; isoString: string } | { success: false; error: string } {
	console.log(existingDate);
	let datePart = "";
	let timePart = "";

	if (existingDate) {
		const d = dayjs(existingDate);
		datePart = d.format("YYYY-MM-DD");
		timePart = d.tz("Asia/Seoul").format("HH:mm");
	}

	console.log({ datePart, timePart });

	if (field === "참석일자") {
		datePart = parseKoreanDate(value);
		console.log("parsed datePart:", datePart);
	} else {
		timePart = parseKoreanTime(value);
		console.log("parsed timePart:", timePart);
	}

	if (!(datePart && timePart)) {
		return { success: false, error: "Invalid date/time value" };
	}

	const dateTimeStr = `${datePart} ${timePart}`;
	const newDateTime = dayjs.tz(dateTimeStr, "Asia/Seoul");
	console.log("combined dateTime:", newDateTime.format("YYYY-MM-DD HH:mm"));

	if (!newDateTime.isValid()) {
		return {
			success: false,
			error: `Invalid date/time combination: ${dateTimeStr}`,
		};
	}

	return { success: true, isoString: newDateTime.toISOString() };
}

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
 * 모든 수련회 신청서 조회 (Internal)
 * - Node.js 액션에서 호출 가능
 */
export const getAllInternal = internalQuery({
	handler: async (ctx) => await ctx.db.query("onboarding").collect(),
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
 * ID로 수련회 신청서 조회 (Public)
 * - 클라이언트에서 직접 호출 가능
 * - 민감한 정보(전화번호 등)는 제외하고 반환
 */
export const getById = query({
	args: {
		id: v.id("onboarding"),
	},
	handler: async (ctx, args) => {
		const doc = await ctx.db.get(args.id);
		if (!doc) {
			return null;
		}

		// 민감한 정보 제외
		return omit(doc, ["phone", "phoneHash"]);
	},
});

/**
 * 수련회 신청서 Upsert Internal Mutation
 * - action에서 호출하는 내부 mutation
 */
export const upsertInternal = internalMutation({
	args: {
		// 개인 정보
		name: v.string(),
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
				name: args.name,
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

			// 최초 생성 시 SMS 환영 메시지 발송 (Workpool 사용)
			// await smsPool.enqueueAction(
			// 	ctx,
			// 	internal.sms.sendOnboardingUpdate,
			// 	{ onboardingId: existing._id },
			// 	{
			// 		onComplete: internal.smsHandlers.onSmsComplete,
			// 		context: {
			// 			type: "onboarding-update",
			// 			onboardingId: existing._id,
			// 		},
			// 	}
			// );

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
			name: args.name,
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

/**
 * 스프레드시트에서 특정 필드 업데이트
 * - Google Sheets 웹훅에서 호출 (TanStack API 라우터 경유)
 */
export const updateFieldFromSpreadsheet = mutation({
	args: {
		id: v.id("onboarding"),
		field: v.string(),
		value: v.string(),
	},
	handler: async (ctx, args) => {
		const { id, field, value } = args;

		// 참석일자/참석시간 처리
		if (field === "참석일자" || field === "참석시간") {
			const doc = await ctx.db.get(id);
			if (!doc) {
				return { success: false, error: "Document not found" };
			}

			const result = buildAttendanceDateTime(doc.attendanceDate, field, value);
			if (!result.success) {
				return result;
			}

			await ctx.db.patch(id, { attendanceDate: result.isoString });
			console.log(
				`[Spreadsheet Webhook] Updated attendanceDate to ${result.isoString} for ${id}`
			);
			return { success: true, field, value };
		}

		// 업데이트 가능한 필드 목록 및 변환 로직
		const updater = fieldUpdaters[field];
		if (!updater) {
			console.log(`[Spreadsheet Webhook] Unknown field: ${field}`);
			return { success: false, error: `Unknown field: ${field}` };
		}

		const updateData = updater(value);
		if (!updateData) {
			console.log(
				`[Spreadsheet Webhook] Invalid value for field ${field}: ${value}`
			);
			return { success: false, error: `Invalid value for field ${field}` };
		}

		await ctx.db.patch(id, updateData);
		console.log(`[Spreadsheet Webhook] Updated ${field} to ${value} for ${id}`);

		return { success: true, field, value };
	},
});

/**
 * 신청서 목록 조회 (Full-text Search + 페이지네이션)
 * - Convex searchIndex를 사용한 이름 검색
 * - 부서 필터 지원
 */
export const searchOnboardings = query({
	args: {
		searchQuery: v.optional(v.string()),
		department: v.optional(departmentValidator),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const dept = args.department;
		const searchTerm = args.searchQuery?.trim();

		// 검색어가 있으면 searchIndex 사용
		if (searchTerm) {
			// searchIndex는 paginate를 직접 지원하지 않으므로 take 사용
			const searchResults = dept
				? await ctx.db
						.query("onboarding")
						.withSearchIndex("search_name", (q) =>
							q.search("name", searchTerm).eq("department", dept)
						)
						.take(100)
				: await ctx.db
						.query("onboarding")
						.withSearchIndex("search_name", (q) => q.search("name", searchTerm))
						.take(100);

			// 목록용 데이터로 변환
			const results = searchResults.map((item) => ({
				_id: item._id,
				_creationTime: item._creationTime,
				name: item.name as string,
				gender: item.gender,
				department: item.department,
				ageGroup: item.ageGroup,
				stayType: item.stayType,
				isPaid: item.isPaid,
				tfTeam: item.tfTeam,
				tshirtSize: item.tshirtSize,
			}));

			return {
				page: results,
				isDone: true,
				continueCursor: "",
			};
		}

		// 검색어가 없으면 일반 쿼리 + 페이지네이션
		const baseQuery = dept
			? ctx.db
					.query("onboarding")
					.withIndex("by_department", (q) => q.eq("department", dept))
			: ctx.db.query("onboarding");

		const paginatedResult = await baseQuery
			.order("desc")
			.paginate(args.paginationOpts);

		// 목록용 데이터로 변환
		const results = paginatedResult.page.map((item) => ({
			_id: item._id,
			_creationTime: item._creationTime,
			name: item.name as string,
			gender: item.gender,
			department: item.department,
			ageGroup: item.ageGroup,
			stayType: item.stayType,
			isPaid: item.isPaid,
			tfTeam: item.tfTeam,
			tshirtSize: item.tshirtSize,
		}));

		return {
			page: results,
			isDone: paginatedResult.isDone,
			continueCursor: paginatedResult.continueCursor,
		};
	},
});

/**
 * 미입금 알림 대상자 조회 (Internal)
 * - 미입금 상태
 * - 알림 발송 조건 충족 (최초 3일 후, 이후 3일 간격, 최대 3회)
 */
export const getUnpaidForReminder = internalQuery({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

		const unpaidUsers = await ctx.db
			.query("onboarding")
			.withIndex("by_isPaid", (q) => q.eq("isPaid", false))
			.collect();

		return unpaidUsers.filter((user) => {
			const status = user.unpaidNotificationStatus;

			// 1. 아직 알림을 한 번도 안 받은 경우
			if (!status) {
				// 신청 후 3일 지났는지 확인
				return now - user._creationTime >= THREE_DAYS_MS;
			}

			// 2. 이미 알림을 받은 경우
			// 최대 3회 미만이고, 마지막 발송 후 3일 지났는지 확인
			return status.sentCount < 3 && now - status.lastSentAt >= THREE_DAYS_MS;
		});
	},
});

/**
 * 미입금 알림 발송 상태 업데이트 (Internal)
 */
export const updatePaymentReminderStatus = internalMutation({
	args: {
		onboardingId: v.id("onboarding"),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.onboardingId);
		if (!user) {
			return;
		}

		const currentCount = user.unpaidNotificationStatus?.sentCount ?? 0;

		await ctx.db.patch(args.onboardingId, {
			unpaidNotificationStatus: {
				lastSentAt: Date.now(),
				sentCount: currentCount + 1,
			},
		});
	},
});
