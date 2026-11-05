import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { DateTimePicker } from "@jwc/ui-patterns/components/date-time-picker";
import { FormRow, Section } from "@jwc/ui-patterns/components/form-controls";
import { Input } from "@jwc/ui/components/input";
import { Textarea } from "@jwc/ui/components/textarea";
import { useId, useMemo } from "react";

import type { MetaPatch } from "../../model/actions";
import { anchorChoices, IDENTITY_TYPES } from "../../model/derive";
import {
	useEditorActions,
	useEditorIndex,
	useEditorIssues,
} from "../editor-context";
import { AnchorSelect, settingsDomId } from "./shared";

/** 브라우저가 아는 IANA 시간대 목록. 모듈 로드 시 한 번만 계산하고, 자동완성은 네이티브 datalist에 맡긴다 */
const TIME_ZONES: readonly string[] =
	typeof Intl.supportedValuesOf === "function"
		? Intl.supportedValuesOf("timeZone")
		: ["Asia/Seoul"];

function isKnownTimeZone(zone: string): boolean {
	try {
		// 알 수 없는 IANA 이름이면 생성자가 RangeError를 던진다
		return (
			new Intl.DateTimeFormat("ko-KR", { timeZone: zone }).resolvedOptions()
				.timeZone !== ""
		);
	} catch (error) {
		if (error instanceof RangeError) {
			return false;
		}
		throw error;
	}
}

type MetaSet = (key: keyof MetaPatch, value: string | undefined) => void;

interface MetaTextSpec {
	hint?: string;
	key: "title" | "description" | "completionMessage";
	label: string;
	/** 0이면 한 줄 입력 */
	rows: number;
}

/** 기본 정보의 단순 텍스트 항목은 표로 기술하고 한 번에 그린다 (일시/시간대 위·아래) */
const HEAD_TEXT_FIELDS: readonly MetaTextSpec[] = [
	{ key: "title", label: "폼 제목", rows: 0 },
	{
		key: "description",
		label: "소개 문구",
		hint: "신청 화면 첫 페이지 상단에 표시됩니다",
		rows: 3,
	},
];
const TAIL_TEXT_FIELDS: readonly MetaTextSpec[] = [
	{
		key: "completionMessage",
		label: "완료 안내 문구",
		hint: "제출 후 완료 화면에 표시됩니다",
		rows: 2,
	},
];

function MetaTextField({
	spec,
	value,
	set,
}: {
	spec: MetaTextSpec;
	value: string;
	set: MetaSet;
}) {
	return (
		<FormRow hint={spec.hint} label={spec.label}>
			{(ids) =>
				spec.rows === 0 ? (
					<Input
						id={ids.inputId}
						onChange={(event) => set(spec.key, event.target.value)}
						value={value}
					/>
				) : (
					<Textarea
						aria-describedby={ids.describedBy}
						id={ids.inputId}
						onChange={(event) => set(spec.key, event.target.value || undefined)}
						rows={spec.rows}
						value={value}
					/>
				)
			}
		</FormRow>
	);
}

/** 마감 날짜만 골랐을 때의 시각: 그날이 끝날 때 */
const DEADLINE_DEFAULT_TIME = "23:59";

function ClosesAtField({
	value,
	set,
}: {
	value: string | undefined;
	set: MetaSet;
}) {
	return (
		<FormRow
			hint="이 시각 이후에는 제출할 수 없습니다. 비우면 수동으로 마감합니다."
			label="마감 일시"
		>
			{(ids) => (
				// 날짜만 고르면 그날 23:59 마감 (가장 흔한 의도). 지우기는 달력 안에서
				<DateTimePicker
					clearable
					defaultTime={DEADLINE_DEFAULT_TIME}
					describedBy={ids.describedBy}
					id={ids.inputId}
					onChange={(next) => set("closesAt", next)}
					stepMinutes={1}
					value={value}
				/>
			)}
		</FormRow>
	);
}

function TimezoneField({ value, set }: { value: string; set: MetaSet }) {
	const zonesId = useId();
	const error = isKnownTimeZone(value) ? undefined : "알 수 없는 시간대입니다";
	return (
		<FormRow error={error} hint="마감 일시와 시트 시각의 기준" label="시간대">
			{(ids) => (
				<>
					<Input
						aria-describedby={ids.describedBy}
						aria-invalid={ids.invalid}
						id={ids.inputId}
						list={zonesId}
						onChange={(event) => set("timezone", event.target.value)}
						value={value}
					/>
					<datalist id={zonesId}>
						{TIME_ZONES.map((zone) => (
							// oxlint-disable-next-line jsx-a11y/control-has-associated-label -- datalist 항목은 조작 컨트롤이 아니라 자동완성 후보이며 value가 곧 표시 이름이다
							<option key={zone} value={zone} />
						))}
					</datalist>
				</>
			)}
		</FormRow>
	);
}

export function BasicSection({ definition }: { definition: FormDefinition }) {
	const { dispatch } = useEditorActions();
	const issues = useEditorIssues();
	const set: MetaSet = (key, value) =>
		dispatch({ type: "meta/update", patch: { [key]: value } });
	const text = (spec: MetaTextSpec) => (
		<MetaTextField
			key={spec.key}
			set={set}
			spec={spec}
			value={definition[spec.key] ?? ""}
		/>
	);
	return (
		<Section
			id={settingsDomId("basic")}
			issues={issues.bySection.get("basic")}
			title="기본 정보"
		>
			{HEAD_TEXT_FIELDS.map(text)}
			{/* 마감 일시(날짜+시+분 세 칸)가 잘리지 않도록 시간대보다 넓게 */}
			<div className="grid gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<ClosesAtField set={set} value={definition.closesAt} />
				<TimezoneField set={set} value={definition.timezone} />
			</div>
			{TAIL_TEXT_FIELDS.map(text)}
		</Section>
	);
}

export function IdentitySection({
	definition,
}: {
	definition: FormDefinition;
}) {
	const { dispatch } = useEditorActions();
	const index = useEditorIndex();
	const issues = useEditorIssues();
	const choices = useMemo(
		() => anchorChoices(definition, index, IDENTITY_TYPES),
		[definition, index],
	);
	return (
		<Section
			description="같은 값으로 다시 제출하면 새 응답 대신 기존 응답을 수정합니다."
			id={settingsDomId("identity")}
			issues={issues.bySection.get("identity")}
			title="응답자 식별"
		>
			<AnchorSelect
				choices={choices}
				hint="전화번호·이메일·단답형 중 필수이고 조건 없이 항상 보이는 질문"
				label="식별 기준 질문"
				onChange={(fieldId) => dispatch({ type: "identity/set", fieldId })}
				value={definition.identity.fieldId}
			/>
		</Section>
	);
}
