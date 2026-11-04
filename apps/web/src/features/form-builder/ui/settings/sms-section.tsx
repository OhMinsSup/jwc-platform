import type {
	FormDefinition,
	NotificationKind,
} from "@jwc/form-core/definition/definition";
import { ConfirmDialog } from "@jwc/ui-patterns/components/confirm-dialog";
import { Section } from "@jwc/ui-patterns/components/form-controls";
import { LabeledSwitch } from "@jwc/ui-patterns/components/pickers";
import { useMemo, useState } from "react";

import { anchorChoices, CONTACT_TYPES } from "../../model/derive";
import { DEFAULT_TEMPLATES } from "../../model/reducer-settings";
import {
	useEditorActions,
	useEditorIndex,
	useEditorIssues,
} from "../editor-context";
import {
	AnchorSelect,
	settingsDomId,
	TemplateEditor,
	ToggleCard,
} from "./shared";

/** SMS 섹션에서 다루는 알림 (미입금 알림은 결제 섹션이 규칙과 함께 관리) */
const SMS_TEMPLATES: readonly {
	kind: NotificationKind;
	label: string;
	hint: string;
}[] = [
	{ kind: "onCreate", label: "신청 완료 알림", hint: "처음 제출했을 때" },
	{
		kind: "onUpdate",
		label: "수정 완료 알림",
		hint: "같은 사람이 다시 제출해 응답이 수정됐을 때",
	},
];

function TemplateCard({
	definition,
	spec,
}: {
	definition: FormDefinition;
	spec: (typeof SMS_TEMPLATES)[number];
}) {
	const { dispatch } = useEditorActions();
	const { kind } = spec;
	const template = definition.notifications?.[kind];
	const set = (next: string | null) =>
		dispatch({ type: "notification/set", kind, template: next });
	return (
		<ToggleCard
			checked={template !== undefined}
			hint={spec.hint}
			onChange={(on) => set(on ? DEFAULT_TEMPLATES[kind] : null)}
			title={spec.label}
		>
			<TemplateEditor
				definition={definition}
				label="문구"
				onChange={set}
				value={template ?? ""}
			/>
		</ToggleCard>
	);
}

/** 끄면 문구까지 지워지므로 한 번 확인한다 */
function SmsOffConfirm({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const { dispatch } = useEditorActions();
	return (
		<ConfirmDialog
			confirmLabel="끄기"
			description="작성한 알림 문구와 미입금 알림 설정이 함께 지워집니다."
			onCancel={onClose}
			onConfirm={() => {
				dispatch({ type: "sms/set", phoneFieldId: null });
				onClose();
			}}
			open={open}
			title="SMS 알림을 끌까요?"
		/>
	);
}

export function SmsSection({ definition }: { definition: FormDefinition }) {
	const { dispatch } = useEditorActions();
	const index = useEditorIndex();
	const issues = useEditorIssues();
	const [confirmOff, setConfirmOff] = useState(false);
	const choices = useMemo(
		() => anchorChoices(definition, index, CONTACT_TYPES),
		[definition, index],
	);
	const enabled = definition.contact !== undefined;
	const toggle = (on: boolean) => {
		if (!on) {
			setConfirmOff(true);
			return;
		}
		const first = choices.find((choice) => !choice.disabledReason);
		dispatch({ type: "sms/set", phoneFieldId: first?.field.id ?? "" });
	};
	return (
		<Section
			action={
				<LabeledSwitch checked={enabled} label="사용" onChange={toggle} />
			}
			description="제출/수정 시 신청자에게 문자를 보냅니다."
			id={settingsDomId("sms")}
			issues={issues.bySection.get("sms")}
			title="SMS 알림"
		>
			{enabled && (
				<AnchorSelect
					choices={choices}
					hint="필수이고 조건 없이 항상 보이는 전화번호 질문"
					label="수신 번호 질문"
					onChange={(phoneFieldId) =>
						dispatch({ type: "sms/set", phoneFieldId })
					}
					value={definition.contact?.phoneFieldId ?? ""}
				/>
			)}
			{enabled &&
				SMS_TEMPLATES.map((spec) => (
					<TemplateCard definition={definition} key={spec.kind} spec={spec} />
				))}
			<SmsOffConfirm onClose={() => setConfirmOff(false)} open={confirmOff} />
		</Section>
	);
}
