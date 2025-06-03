import * as R from "remeda";

import { gapi } from "@jwc/google";
import { env } from "@jwc/payload/env";
import * as Sentry from "@sentry/nextjs";
import type { CollectionAfterChangeHook } from "payload";
import type { Form } from "../../types";

export const syncGoogleSheet: CollectionAfterChangeHook<Form> = async ({
	doc,
	req,
}) => {
	try {
		const { docs } = await req.payload.find({
			collection: "forms",
			limit: 100,
		});

		// id가 같은 항목이 있으면 값이 다를 때만 교체, 없으면 추가
		const meredDocs = R.pipe(
			docs as Form[],
			R.mapToObj((f) => [f.id, f]),
			(obj) => {
				const prev = obj[doc.id];
				if (!prev) {
					obj[doc.id] = doc; // id 없으면 추가
				} else if (!R.isDeepEqual(prev, doc)) {
					obj[doc.id] = doc; // 값 다르면 업데이트
				}
				// 값이 같으면 아무것도 안 함
				return obj;
			},
			R.values<Record<number, Form>>, // 객체를 배열로 변환
			R.sortBy((f) => new Date(f.createdAt).getTime()) // 타임스탬프 내림차순 정렬
		);

		await gapi.setDocs(meredDocs).upsertGoogleSheetTable();
	} catch (error) {
		if (env.NODE_ENV === "development") {
			req.payload.logger.error(error);
		} else if (error instanceof Error) {
			Sentry.logger.error(error.message, {
				name: "syncGoogleSheet",
				action: "collectionAfterChangeHook",
			});
			Sentry.captureException(error, {
				tags: {
					component: "syncGoogleSheet",
					action: "collectionAfterChangeHook",
				},
			});
		}
	}

	return doc;
};
