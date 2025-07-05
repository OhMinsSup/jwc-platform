"use client";

import {
	type ClubFormState,
	downloadClubFormExcelAction,
} from "@jwc/payload/actions/clubForms.actions";
import { Button, toast } from "@payloadcms/ui";
import * as Sentry from "@sentry/nextjs";
import FileSaver from "file-saver";
import type React from "react";
import { useActionState, useEffect } from "react";

/**
 * ClubFormExcelExportButton 컴포넌트 props
 */
interface ClubFormExcelExportButtonProps {
	/** 커스텀 버튼 텍스트 */
	children?: React.ReactNode;
	/** 토스트 메시지 표시 여부 (기본값: true) */
	showToast?: boolean;
}

export default function ClubFormExcelExportButton({
	children,
	showToast = true,
}: ClubFormExcelExportButtonProps = {}) {
	const [state, formAction, isPending] = useActionState(
		async (prevState: ClubFormState) => {
			if (showToast) {
				toast.info("📊 동아리 신청서 엑셀 파일을 생성하고 있습니다...");
			}
			return await downloadClubFormExcelAction();
		},
		null
	);

	// 서버 액션 실행 후 결과 처리
	useEffect(() => {
		if (state) {
			if (state.success) {
				// Excel 파일 다운로드 처리
				if (state.format === "excel" && state.downloadUrl && state.filename) {
					try {
						// 다운로드 URL로 파일 다운로드
						const downloadFile = async () => {
							if (!state.downloadUrl || !state.filename) {
								throw new Error("Download URL or filename is missing");
							}

							const response = await fetch(state.downloadUrl);
							if (!response.ok) {
								throw new Error(`HTTP error! status: ${response.status}`);
							}

							const blob = await response.blob();
							FileSaver.saveAs(blob, state.filename);

							if (showToast) {
								toast.success(
									"✅ 동아리 신청서 엑셀 파일이 성공적으로 다운로드되었습니다!"
								);
							}
						};

						downloadFile().catch((error) => {
							console.error("File download error:", error);
							if (showToast) {
								toast.error("❌ 파일 다운로드 중 오류가 발생했습니다");
							}

							Sentry.captureException(error, {
								tags: {
									component: "ClubFormExcelExportButton",
									action: "fileDownload",
									type: "client-side",
								},
							});
						});
					} catch (error) {
						console.error("File download error:", error);
						if (showToast) {
							toast.error("❌ 파일 다운로드 중 오류가 발생했습니다");
						}

						Sentry.captureException(error, {
							tags: {
								component: "ClubFormExcelExportButton",
								action: "fileDownload",
								type: "client-side",
							},
						});
					}
				} else {
					if (showToast) {
						toast.success(state.message);
					}
				}
			} else {
				// 에러 처리
				if (showToast) {
					toast.error(
						state.message ||
							"❌ 동아리 신청서 엑셀 파일 생성 중 오류가 발생했습니다"
					);
				}

				Sentry.captureMessage(
					state.message || "Club form Excel export failed",
					{
						level: "error",
						tags: {
							component: "ClubFormExcelExportButton",
							action: "serverAction",
							type: "server-side",
						},
					}
				);
			}
		}
	}, [state, showToast]);

	return (
		<form action={formAction} aria-disabled={isPending}>
			<Button type="submit" disabled={isPending} aria-disabled={isPending}>
				{children ||
					(isPending
						? "동아리 신청서 엑셀 파일 생성 중..."
						: "동아리 신청서 엑셀 다운로드")}
			</Button>
		</form>
	);
}
