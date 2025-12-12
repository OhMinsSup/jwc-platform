import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** 성별 타입 */
const genderType = v.union(v.literal("male"), v.literal("female"));

/** 부서 타입 (청년1부, 청년2부, 기타) */
const departmentType = v.union(
	v.literal("youth1"), // 청년1부
	v.literal("youth2"), // 청년2부
	v.literal("other") // 기타
);

/** 숙박 형태 타입 */
const stayType = v.union(
	v.literal("3nights4days"), // 3박4일
	v.literal("2nights3days"), // 2박3일
	v.literal("1night2days"), // 1박2일
	v.literal("dayTrip") // 무박 (당일치기)
);

/** TF팀 타입 */
const tfTeamType = v.union(
	v.literal("none"), // 없음
	v.literal("praise"), // 찬양팀
	v.literal("program"), // 프로그램팀
	v.literal("media") // 미디어팀
);

/** 티셔츠 사이즈 타입 */
const tshirtSizeType = v.union(
	v.literal("s"),
	v.literal("m"),
	v.literal("l"),
	v.literal("xl"),
	v.literal("2xl"),
	v.literal("3xl")
);

export default defineSchema({
	users: defineTable({
		email: v.string(),
	}).index("email", ["email"]),

	/**
	 * 수련회 신청서 테이블
	 * - 청년부 수련회 참가 신청 정보를 저장
	 */
	onboarding: defineTable({
		// ──────────────────────────────────────────────────────
		// 기본 개인 정보
		// ──────────────────────────────────────────────────────

		/** 이름 (평문) */
		name: v.string(),

		/** 전화번호 (암호화됨 - JSON 문자열: {ciphertext, iv}) */
		phone: v.record(v.string(), v.string()),

		/** 전화번호 해시 (검색/식별용 - SHA-256) */
		phoneHash: v.string(),

		/** 성별 */
		gender: genderType,

		/** 소속 부서 */
		department: departmentType,

		/** 또래 (나이대 그룹) */
		ageGroup: v.string(),

		// ──────────────────────────────────────────────────────
		// 참석 정보
		// ──────────────────────────────────────────────────────

		/** 숙박 형태 */
		stayType,

		/** 참석 날짜 (ISO 8601 형식) */
		attendanceDate: v.optional(v.string()),

		/**
		 * 픽업 가능 시간 설명
		 * - 부분참일 경우 참석 가능한 시간 또는 픽업 희망 시간
		 */
		pickupTimeDescription: v.optional(v.string()),

		// ──────────────────────────────────────────────────────
		// 회비 및 지원 정보
		// ──────────────────────────────────────────────────────

		/** 회비 납입 여부 */
		isPaid: v.boolean(),

		/** TF팀 지원 */
		tfTeam: v.optional(tfTeamType),

		/** 차량 지원 가능 여부 */
		canProvideRide: v.optional(v.boolean()),

		/** 차량 지원 상세 내용 (탑승 가능 인원, 출발 위치 등) */
		rideDetails: v.optional(v.string()),

		// ──────────────────────────────────────────────────────
		// 기타 정보
		// ──────────────────────────────────────────────────────

		/** 단체티 사이즈 */
		tshirtSize: v.optional(tshirtSizeType),
	})
		// 인덱스 정의
		.index("by_phoneHash", ["phoneHash"])
		.index("by_department", ["department"])
		.index("by_stayType", ["stayType"])
		.index("by_isPaid", ["isPaid"])
		.index("by_name", ["name"])
		// Full-text search 인덱스 (이름 검색)
		.searchIndex("search_name", {
			searchField: "name",
			filterFields: ["department"],
		}),

	/**
	 * 단축 URL 테이블
	 * - SMS 등에서 사용할 짧은 URL 관리
	 */
	shortUrls: defineTable({
		/** 단축 코드 (예: "abc123") */
		code: v.string(),

		/** 원본 URL (리다이렉트 대상) */
		targetUrl: v.string(),

		/** 생성 시간 */
		createdAt: v.number(),

		/** 만료 시간 (optional) */
		expiresAt: v.optional(v.number()),

		/** 메타데이터 (용도, 관련 ID 등) */
		metadata: v.optional(
			v.object({
				type: v.optional(v.string()),
				onboardingId: v.optional(v.id("onboarding")),
			})
		),
	})
		.index("by_code", ["code"])
		.index("by_targetUrl", ["targetUrl"]),
});
