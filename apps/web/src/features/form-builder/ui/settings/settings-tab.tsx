import type { FormDefinition } from "@jwc/form-core/definition/definition";

import { BasicSection, IdentitySection } from "./basic-sections";
import { PaymentSection } from "./payment-section";
import { SmsSection } from "./sms-section";

/** 설정은 위에서 아래로 의존 순서대로 둔다: 식별 → SMS(수신 번호) → 회비(미입금 알림은 SMS 필요) */
export function SettingsTab({ definition }: { definition: FormDefinition }) {
	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<BasicSection definition={definition} />
			<IdentitySection definition={definition} />
			<SmsSection definition={definition} />
			<PaymentSection definition={definition} />
		</div>
	);
}
