"use client";

import { getDateFormat } from "@jwc/utils/date";
import { Button } from "@payloadcms/ui";
import FileSaver from "file-saver";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useTransition } from "react";

export function ExcelExportButton() {
	const [isPending, startTransition] = useTransition();

	const searchParams = useSearchParams();

	const onClick = useCallback(() => {
		startTransition(async () => {
			try {
				const url = new URL("/api/forms/excel/export", window.location.origin);
				url.search = searchParams.toString();
				const response = await fetch(url.toString(), {
					method: "GET",
				});
				const blob = await response.blob();
				FileSaver.saveAs(
					blob,
					`청년부_연합_여름_수련회_참가자_명단_${getDateFormat()}`
				);
			} catch (error) {
				console.error(error);
			}
		});
	}, [searchParams]);

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
