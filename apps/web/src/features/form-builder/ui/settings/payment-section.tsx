import type {
	FormDefinition,
	ReminderRule,
} from "@jwc/form-core/definition/definition";
import {
	FormRow,
	NumberInput,
	Section,
} from "@jwc/ui-patterns/components/form-controls";
import { LabeledSwitch } from "@jwc/ui-patterns/components/pickers";
import { Input } from "@jwc/ui/components/input";

import { useEditorActions, useEditorIssues } from "../editor-context";
import { AmountEditor } from "./amount-editor";
import { settingsDomId, TemplateEditor, ToggleCard } from "./shared";

const REMINDER_FIELDS: readonly {
	key: keyof ReminderRule;
	label: string;
	unit: string;
}[] = [
	{ key: "firstAfterDays", label: "첫 알림", unit: "일 후" },
	{ key: "intervalDays", label: "이후 간격", unit: "일마다" },
	{ key: "maxCount", label: "최대 횟수", unit: "회" },
];

function ReminderEditor({
	definition,
	reminder,
}: {
	definition: FormDefinition;
	reminder: ReminderRule;
}) {
	const { dispatch } = useEditorActions();
	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-3">
				{REMINDER_FIELDS.map(({ key, label, unit }) => (
					<FormRow key={key} label={label}>
						{(ids) => (
							<div className="flex items-center gap-2">
								<NumberInput
									className="w-20"
									id={ids.inputId}
									max={key === "maxCount" ? 10 : 60}
									min={1}
									onValueChange={(value) =>
										dispatch({
											type: "reminder/update",
											patch: { [key]: value ?? 1 },
										})
									}
									value={reminder[key]}
								/>
								<span className="text-muted-foreground text-sm">{unit}</span>
							</div>
						)}
					</FormRow>
				))}
			</div>
			<TemplateEditor
				definition={definition}
				label="미입금 알림 문구"
				onChange={(template) =>
					dispatch({ type: "notification/set", kind: "onReminder", template })
				}
				value={definition.notifications?.onReminder ?? ""}
			/>
		</div>
	);
}

function PaymentBody({
	definition,
	payment,
}: {
	definition: FormDefinition;
	payment: NonNullable<FormDefinition["payment"]>;
}) {
	const { dispatch } = useEditorActions();
	const hasSms = definition.contact !== undefined;
	return (
		<>
			<FormRow hint="예: 카카오뱅크 3333-00-0000000 홍길동" label="입금 계좌">
				{(ids) => (
					<Input
						aria-describedby={ids.describedBy}
						id={ids.inputId}
						maxLength={100}
						onChange={(event) =>
							dispatch({
								type: "payment/update",
								patch: { account: event.target.value },
							})
						}
						value={payment.account}
					/>
				)}
			</FormRow>
			<AmountEditor amount={payment.amount} definition={definition} />
			<ToggleCard
				checked={hasSms ? payment.reminder !== undefined : undefined}
				hint={
					hasSms
						? "납입 전까지 정해진 간격으로 문자를 다시 보냅니다"
						: "SMS 알림을 먼저 켜야 사용할 수 있습니다"
				}
				onChange={(enabled) => dispatch({ type: "reminder/set", enabled })}
				title="미입금 알림"
			>
				{payment.reminder && (
					<ReminderEditor definition={definition} reminder={payment.reminder} />
				)}
			</ToggleCard>
		</>
	);
}

export function PaymentSection({ definition }: { definition: FormDefinition }) {
	const { dispatch } = useEditorActions();
	const issues = useEditorIssues();
	const { payment } = definition;
	return (
		<Section
			action={
				<LabeledSwitch
					checked={payment !== undefined}
					label="사용"
					onChange={(enabled) => dispatch({ type: "payment/set", enabled })}
				/>
			}
			description="신청 완료 화면과 알림에 금액·계좌를 안내하고, 시트에 납입 여부 열을 만듭니다."
			id={settingsDomId("payment")}
			issues={issues.bySection.get("payment")}
			title="회비"
		>
			{payment && <PaymentBody definition={definition} payment={payment} />}
		</Section>
	);
}
