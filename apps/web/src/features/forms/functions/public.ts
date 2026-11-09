import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { toResult } from "../../../platform/server/server-fn";
import { SLUG } from "../../../platform/server/validation";
import { openFormSummaries, publishedFormBySlug } from "../server/definitions";

/**
 * 공개 폼 조회 서버 함수 경계 (로그인 없음).
 */

export const listOpenFormsFn = createServerFn({ method: "GET" }).handler(() =>
	openFormSummaries(),
);

export const getPublicFormFn = createServerFn({ method: "GET" })
	.validator(z.object({ slug: SLUG }))
	.handler(({ data }) =>
		toResult("public.getForm", async () => {
			const { form, definition } = await publishedFormBySlug(data.slug);
			return { slug: form.slug, status: form.status, definition };
		}),
	);
