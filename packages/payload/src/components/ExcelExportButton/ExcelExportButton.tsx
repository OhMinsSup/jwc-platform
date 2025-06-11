"use client";

import { Button, toast } from "@payloadcms/ui";
import * as Sentry from "@sentry/nextjs";
import FileSaver from "file-saver";
import React, { useCallback, useTransition } from "react";

function getFilename(contentDisposition: string | null): string {
	if (!contentDisposition) return "download.xlsx";

	// filename*=UTF-8''encodedName 우선 처리
	const filenameStarMatch = contentDisposition.match(
		/filename\*\s*=\s*UTF-8''([^;\n]*)/i
	);
	if (filenameStarMatch?.[1]) {
		try {
			return decodeURIComponent(filenameStarMatch[1]);
		} catch {
			return filenameStarMatch[1];
		}
	}

	// filename="name.xlsx" 또는 filename=name.xlsx
	const filenameMatch = contentDisposition.match(
		/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
	);
	if (filenameMatch?.[1]) {
		return filenameMatch[1].replace(/^['"]|['"]$/g, "");
	}

	return "download.xlsx";
}

async function getFormExcelDataApi() {
	const url = new URL("/api/forms/excel/export", window.location.origin);
	const response = await fetch(url.toString(), {
		method: "GET",
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error("Failed to fetch Excel data");
	}
	// Content-Disposition 헤더를 통해 파일 이름을 추출할 수 있습니다.
	const contentDisposition = response.headers.get("Content-Disposition");
	const filename = getFilename(contentDisposition);

	return {
		filename,
		blob: await response.blob(),
	};
}

async function downloadExcel() {
	try {
		const { blob, filename } = await getFormExcelDataApi();
		FileSaver.saveAs(blob, filename);
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
