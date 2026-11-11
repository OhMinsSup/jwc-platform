import { MAX_SHEET_TITLE_LENGTH } from "@jwc/google/spreadsheet-ref";
import { Callout } from "@jwc/ui-patterns/components/callout";
import { CopyButton } from "@jwc/ui-patterns/components/copy-button";
import { Button } from "@jwc/ui/components/button";
import { Input } from "@jwc/ui/components/input";
import { Label } from "@jwc/ui/components/label";
import { useRouter } from "@tanstack/react-router";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import type { SubmitEvent } from "react";

import { updateSheetLocationFn } from "../functions/admin";
import type { getSheetSettingsFn } from "../functions/admin";

export type SheetSettings = Extract<
	Awaited<ReturnType<typeof getSheetSettingsFn>>,
	{ ok: true }
>["data"];

type Feedback =
	| { kind: "idle" }
	| { kind: "saved" }
	| { kind: "failed"; message: string; fieldErrors: Record<string, string> };

const IDLE: Feedback = { kind: "idle" };

const NETWORK_FAILURE_MESSAGE =
	"저장하지 못했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.";

interface SaveOutcome {
	feedback: Feedback;
	/** 저장에 성공했을 때 서버가 정리한 값 */
	saved: { spreadsheetId: string | null; sheetName: string } | null;
}

/**
 * 서버 함수 호출 → 화면에 보일 결과. 예상된 실패는 결과 값으로 오고,
 * 요청 자체가 실패하면(네트워크·전송 오류) 예외가 나므로 일반 안내로 바꾼다.
 */
async function saveSheetLocation(
	formId: string,
	values: { spreadsheet: string; sheetName: string },
): Promise<SaveOutcome> {
	try {
		const result = await updateSheetLocationFn({
			data: { formId, ...values },
		});
		if (!result.ok) {
			return {
				feedback: {
					kind: "failed",
					message: result.message,
					fieldErrors: result.fieldErrors ?? {},
				},
				saved: null,
			};
		}
		return { feedback: { kind: "saved" }, saved: result.data };
	} catch {
		// 전송 오류의 종류와 무관하게 사용자에게는 같은 안내를 보인다 (서버는 요청을 받지 못했다)
		return {
			feedback: {
				kind: "failed",
				message: NETWORK_FAILURE_MESSAGE,
				fieldErrors: {},
			},
			saved: null,
		};
	}
}

/**
 * 입력값 + 저장. 저장하면 서버가 정리한 값(URL → ID, 앞뒤 공백 제거)으로 입력칸을 바꾸고,
 * 같은 폼의 다른 화면(머리의 "응답 시트" 링크 등)을 다시 읽는다.
 */
function useSheetLocationForm(settings: SheetSettings) {
	const router = useRouter();
	const [spreadsheet, setSpreadsheet] = useState(settings.spreadsheetId);
	const [sheetName, setSheetName] = useState(settings.sheetName);
	const [pending, setPending] = useState(false);
	const [feedback, setFeedback] = useState<Feedback>(IDLE);
	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setPending(true);
		// saveSheetLocation은 예외를 던지지 않는다 (전송 오류도 결과로 바꾼다) → 처리 중 표시가 항상 풀린다
		const outcome = await saveSheetLocation(settings.id, {
			spreadsheet,
			sheetName,
		});
		setPending(false);
		setFeedback(outcome.feedback);
		if (outcome.saved) {
			setSpreadsheet(outcome.saved.spreadsheetId ?? "");
			setSheetName(outcome.saved.sheetName);
			await router.invalidate();
		}
	};
	return {
		values: { spreadsheet, sheetName },
		handleSpreadsheetChange: setSpreadsheet,
		handleSheetNameChange: setSheetName,
		pending,
		feedback,
		handleSubmit,
	};
}

function FieldError({ id, message }: { id: string; message?: string }) {
	return message ? (
		<p className="text-destructive text-xs" id={id}>
			{message}
		</p>
	) : null;
}

interface TextFieldProps {
	error?: string;
	onChange: (value: string) => void;
	value: string;
}

function SpreadsheetField({
	defaultSpreadsheetUrl,
	error,
	onChange,
	value,
}: TextFieldProps & { defaultSpreadsheetUrl: string }) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor="sheet-spreadsheet">스프레드시트</Label>
			<Input
				aria-describedby="sheet-spreadsheet-hint sheet-spreadsheet-error"
				aria-invalid={error ? true : undefined}
				autoComplete="off"
				id="sheet-spreadsheet"
				name="spreadsheet"
				onChange={(event) => onChange(event.target.value)}
				placeholder="https://docs.google.com/spreadsheets/d/…/edit"
				value={value}
			/>
			<p className="text-muted-foreground text-xs" id="sheet-spreadsheet-hint">
				주소(URL)를 그대로 붙여 넣거나 ID만 넣으세요. 비워 두면{" "}
				<a
					className="hover:text-foreground underline"
					href={defaultSpreadsheetUrl}
					rel="noreferrer"
					target="_blank"
				>
					기본 스프레드시트
					<span className="sr-only">(새 창)</span>
				</a>
				를 씁니다.
			</p>
			<FieldError id="sheet-spreadsheet-error" message={error} />
		</div>
	);
}

function SheetNameField({ error, onChange, value }: TextFieldProps) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor="sheet-name">시트 탭 이름</Label>
			<Input
				aria-describedby="sheet-name-hint sheet-name-error"
				aria-invalid={error ? true : undefined}
				autoComplete="off"
				id="sheet-name"
				maxLength={MAX_SHEET_TITLE_LENGTH}
				name="sheetName"
				onChange={(event) => onChange(event.target.value)}
				placeholder="신청자목록"
				required
				value={value}
			/>
			<p className="text-muted-foreground text-xs" id="sheet-name-hint">
				응답은 이 탭의 시트 표(데이터 테이블)로 저장됩니다. 탭이 없으면 만들고,
				있으면 표로 바꾼 뒤 빠진 열만 오른쪽에 더합니다. 발행된 폼은 저장할 때
				바로 준비합니다.
			</p>
			<FieldError id="sheet-name-error" message={error} />
		</div>
	);
}

function ServiceAccountNote({ email }: { email: string }) {
	return (
		<Callout role="note" title="스프레드시트 공유가 필요합니다" tone="info">
			<p className="text-muted-foreground text-sm">
				새 스프레드시트를 쓰려면 아래 서비스 계정을 해당 스프레드시트의{" "}
				<strong className="text-foreground font-medium">편집자</strong>로
				공유해주세요.
			</p>
			<span className="bg-muted inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1">
				<code className="min-w-0 font-mono text-xs break-all">{email}</code>
				<CopyButton label="서비스 계정 주소 복사" text={email} />
			</span>
		</Callout>
	);
}

/** 저장 결과. 성공 문장은 output(상태 알림)으로 읽어 준다 */
function SaveFeedback({ feedback }: { feedback: Feedback }) {
	if (feedback.kind === "failed") {
		return <Callout role="alert" title={feedback.message} tone="danger" />;
	}
	return (
		<output className="block empty:hidden">
			{feedback.kind === "saved" && (
				<Callout title="응답 시트 설정을 저장했습니다." tone="success" />
			)}
		</output>
	);
}

function MovedResponsesNote() {
	return (
		<Callout
			role="note"
			title="이미 받은 응답은 옮겨지지 않습니다"
			tone="warning"
		>
			<p className="text-muted-foreground text-sm">
				저장하면 이후 응답·응답 목록·납입 변경은 새 위치를 씁니다. 기존 응답이
				필요하면 시트에서 직접 옮겨주세요.
			</p>
		</Callout>
	);
}

function FormActions({
	pending,
	spreadsheetUrl,
}: {
	pending: boolean;
	spreadsheetUrl: string;
}) {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<Button disabled={pending} type="submit">
				{pending && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
				저장
			</Button>
			<a
				className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm hover:underline"
				href={spreadsheetUrl}
				rel="noreferrer"
				target="_blank"
			>
				현재 스프레드시트 열기
				<ExternalLink aria-hidden className="h-3 w-3" />
				<span className="sr-only">(새 창)</span>
			</a>
		</div>
	);
}

/** 폼의 응답 시트 위치(스프레드시트 + 탭) 설정 */
export function SheetSettingsForm({ settings }: { settings: SheetSettings }) {
	const {
		values,
		pending,
		feedback,
		handleSubmit,
		handleSpreadsheetChange,
		handleSheetNameChange,
	} = useSheetLocationForm(settings);
	const fieldErrors = feedback.kind === "failed" ? feedback.fieldErrors : {};
	return (
		<form className="max-w-xl min-w-0 space-y-5" onSubmit={handleSubmit}>
			<div className="space-y-1">
				<h2 className="text-base font-semibold">응답 시트</h2>
				<p className="text-muted-foreground text-sm">
					신청 응답을 저장할 구글 스프레드시트와 탭을 정합니다.
				</p>
			</div>
			<SpreadsheetField
				defaultSpreadsheetUrl={settings.defaultSpreadsheetUrl}
				error={fieldErrors.spreadsheetId}
				onChange={handleSpreadsheetChange}
				value={values.spreadsheet}
			/>
			<SheetNameField
				error={fieldErrors.sheetName}
				onChange={handleSheetNameChange}
				value={values.sheetName}
			/>
			<ServiceAccountNote email={settings.serviceAccountEmail} />
			{settings.published && <MovedResponsesNote />}
			<SaveFeedback feedback={feedback} />
			<FormActions pending={pending} spreadsheetUrl={settings.spreadsheetUrl} />
		</form>
	);
}
