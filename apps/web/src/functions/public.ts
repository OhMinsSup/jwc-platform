import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
	openFormSummaries,
	publishedFormBySlug,
} from "../server/services/definitions";
import { loadSubmissionView } from "../server/services/submission-view";
import { submitAnswers } from "../server/services/submit";
import { toResult } from "./result";

const SLUG = z.string().regex(/^[a-z0-9][a-z0-9-]{1,60}$/u);
const ID = z.string().regex(/^[A-Za-z0-9_-]{10,40}$/u);
const MAX_ANSWER_KEYS = 200;

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

export const submitFormFn = createServerFn({ method: "POST" })
	.validator(
		z.object({
			slug: SLUG,
			answers: z
				.record(z.string().max(40), z.unknown())
				.refine((value) => Object.keys(value).length <= MAX_ANSWER_KEYS),
		}),
	)
	.handler(({ data }) =>
		toResult("public.submit", () =>
			submitAnswers(data.slug, data.answers, Date.now()),
		),
	);

export const getSubmissionViewFn = createServerFn({ method: "GET" })
	.validator(z.object({ id: ID }))
	.handler(({ data }) =>
		toResult("public.submissionView", () => loadSubmissionView(data.id)),
	);
