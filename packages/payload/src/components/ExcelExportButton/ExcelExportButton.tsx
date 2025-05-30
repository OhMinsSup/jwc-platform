"use client";

import { getDateFormat } from "@jwc/utils/date";
import { Button, toast } from "@payloadcms/ui";
import * as Sentry from "@sentry/nextjs";
import FileSaver from "file-saver";
import React, { useCallback, useTransition } from "react";

async function getFormByExcel() {
	const url = new URL("/api/forms/excel/export", window.location.origin);
	const response = await fetch(url.toString(), {
		method: "GET",
	});
	return await response.blob();
}

async function downloadExcel() {
	try {
		const time = getDateFormat();
		const blob = await getFormByExcel();
		FileSaver.saveAs(blob, `청년부_연합_여름_수련회_참가자_명단_${time}`);
	} catch (error) {
		toast.error("❌ 엑셀 파일을 생성하는 중 오류가 발생했습니다");
		Sentry.captureException(error, {
			tags: {
				component: "ExcelExportButton",
				action: "downloadExcel",
			},
		});
	}
}

export function ExcelExportButton() {
	const [isPending, startTransition] = useTransition();

	const onClick = useCallback(() => {
		startTransition(async () => {
			await downloadExcel();
		});
	}, []);

	return (
		<>
			<Button
				disabled={isPending}
				aria-disabled={isPending}
				type="button"
				onClick={onClick}
			>
				{isPending ? "엑셀 파일 생성 중..." : "액셀 다운로드"}
			</Button>
		</>
	);
}
