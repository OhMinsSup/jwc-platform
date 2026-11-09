import type { FormDefinition } from "@jwc/form-core/definition/definition";
import { FormRow, Section } from "@jwc/ui-patterns/components/form-controls";
import { LabeledSwitch } from "@jwc/ui-patterns/components/pickers";
import { Input } from "@jwc/ui/components/input";

import { useEditorActions, useEditorIssues } from "../editor-context";
import { AmountEditor } from "./amount-editor";
import { settingsDomId } from "./shared";

function PaymentBody({
	definition,
	payment,
}: {
	definition: FormDefinition;
	payment: NonNullable<FormDefinition["payment"]>;
}) {
	const { dispatch } = useEditorActions();
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
