/**
 * 단축 URL 관리
 *
 * SMS 등에서 사용할 짧은 URL을 생성하고 관리합니다.
 */

import { v } from "convex/values";
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";

/** 단축 코드 길이 */
const CODE_LENGTH = 6;

/** 단축 코드에 사용할 문자 (혼동하기 쉬운 문자 제외: 0, O, l, 1, I) */
const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

/**
 * 랜덤 단축 코드 생성
 */
function generateShortCode(length: number = CODE_LENGTH): string {
	let code = "";
	for (let i = 0; i < length; i++) {
		code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
	}
	return code;
}

/**
 * 단축 URL 생성 (Internal)
 * - Convex action에서 호출
 */
export const createInternal = internalMutation({
	args: {
		targetUrl: v.string(),
		expiresAt: v.optional(v.number()),
		metadata: v.optional(
			v.object({
				type: v.optional(v.string()),
				onboardingId: v.optional(v.id("onboarding")),
			})
		),
	},
	handler: async (ctx, { targetUrl, expiresAt, metadata }) => {
		// 고유한 코드 생성 (충돌 방지)
		let code: string;
		let attempts = 0;
		const maxAttempts = 10;

		do {
			code = generateShortCode();
			const existing = await ctx.db
				.query("shortUrls")
				.withIndex("by_code", (q) => q.eq("code", code))
				.first();

			if (!existing) {
				break;
			}
			attempts += 1;
		} while (attempts < maxAttempts);

		if (attempts >= maxAttempts) {
			throw new Error("Failed to generate unique short code");
		}

		const id = await ctx.db.insert("shortUrls", {
			code,
			targetUrl,
			createdAt: Date.now(),
			expiresAt,
			metadata,
		});

		return { id, code };
	},
});

/**
 * 단축 URL 생성 (Public)
 */
export const create = mutation({
	args: {
		targetUrl: v.string(),
		expiresAt: v.optional(v.number()),
		metadata: v.optional(
			v.object({
				type: v.optional(v.string()),
				onboardingId: v.optional(v.id("onboarding")),
			})
		),
	},
	handler: async (ctx, { targetUrl, expiresAt, metadata }) => {
		// 고유한 코드 생성 (충돌 방지)
		let code: string;
		let attempts = 0;
		const maxAttempts = 10;

		do {
			code = generateShortCode();
			const existing = await ctx.db
				.query("shortUrls")
				.withIndex("by_code", (q) => q.eq("code", code))
				.first();

			if (!existing) {
				break;
			}
			attempts += 1;
		} while (attempts < maxAttempts);

		if (attempts >= maxAttempts) {
			throw new Error("Failed to generate unique short code");
		}

		const id = await ctx.db.insert("shortUrls", {
			code,
			targetUrl,
			createdAt: Date.now(),
			expiresAt,
			metadata,
		});

		return { id, code };
	},
});

/**
 * 코드로 단축 URL 조회
 */
export const getByCode = query({
	args: { code: v.string() },
	handler: async (ctx, { code }) => {
		const shortUrl = await ctx.db
			.query("shortUrls")
			.withIndex("by_code", (q) => q.eq("code", code))
			.first();

		if (!shortUrl) {
			return null;
		}

		// 만료 확인
		if (shortUrl.expiresAt && shortUrl.expiresAt < Date.now()) {
			return null;
		}

		return shortUrl;
	},
});

/**
 * 코드로 단축 URL 조회 (Internal)
 */
export const getByCodeInternal = internalQuery({
	args: { code: v.string() },
	handler: async (ctx, { code }) => {
		const shortUrl = await ctx.db
			.query("shortUrls")
			.withIndex("by_code", (q) => q.eq("code", code))
			.first();

		if (!shortUrl) {
			return null;
		}

		// 만료 확인
		if (shortUrl.expiresAt && shortUrl.expiresAt < Date.now()) {
			return null;
		}

		return shortUrl;
	},
});

/**
 * 단축 URL 삭제
 */
export const remove = mutation({
	args: { code: v.string() },
	handler: async (ctx, { code }) => {
		const shortUrl = await ctx.db
			.query("shortUrls")
			.withIndex("by_code", (q) => q.eq("code", code))
			.first();

		if (!shortUrl) {
			return false;
		}

		await ctx.db.delete(shortUrl._id);
		return true;
	},
});

/**
 * 만료된 단축 URL 정리 (Internal - 스케줄러에서 호출)
 */
export const cleanupExpired = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const expiredUrls = await ctx.db
			.query("shortUrls")
			.filter((q) => q.lt(q.field("expiresAt"), now))
			.collect();

		let deletedCount = 0;
		for (const url of expiredUrls) {
			await ctx.db.delete(url._id);
			deletedCount += 1;
		}

		return { deletedCount };
	},
});
