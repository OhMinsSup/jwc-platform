import type {
	FormDefinition,
	NotificationKind,
} from "@jwc/form-core/definition/definition";

import type { SettingsAction } from "./actions";

/** 기능을 켤 때 채워 넣는 시작 문구. 운영 데이터가 아니라 편집 편의용 초기값이다. */
export const DEFAULT_TEMPLATES: Record<NotificationKind, string> = {
	onCreate: "[{{title}}]\n신청이 완료되었습니다.\n{{link}}",
	onUpdate: "[{{title}}]\n신청 내용이 수정되었습니다.\n{{link}}",
};

type State = FormDefinition;
type Handler<T extends SettingsAction["type"]> = (
	state: State,
	action: Extract<SettingsAction, { type: T }>,
) => State;
export type SettingsHandlers = { [T in SettingsAction["type"]]: Handler<T> };

type Notifications = NonNullable<State["notifications"]>;

/** 빈 알림 객체는 undefined로 접는다 (저장 데이터에 의미 없는 {}를 남기지 않음) */
function setTemplate(
	notifications: State["notifications"],
	kind: NotificationKind,
	template: string | null,
): State["notifications"] {
	if (template !== null) {
		return { ...notifications, [kind]: template };
	}
	const { [kind]: _removed, ...next }: Notifications = notifications ?? {};
	return Object.keys(next).length > 0 ? next : undefined;
}

/** SMS를 끄면 수신 번호와 알림 문구를 함께 해제한다. */
const setSms: Handler<"sms/set"> = (state, { phoneFieldId }) => {
	if (phoneFieldId === null) {
		return {
			...state,
			contact: undefined,
			notifications: undefined,
		};
	}
	return {
		...state,
		contact: { phoneFieldId },
		notifications: state.notifications ?? {
			onCreate: DEFAULT_TEMPLATES.onCreate,
		},
	};
};

export const SETTINGS_HANDLERS: SettingsHandlers = {
	"meta/update": (state, { patch }) => ({ ...state, ...patch }),
	"identity/set": (state, { fieldId }) => ({ ...state, identity: { fieldId } }),
	"sms/set": setSms,
	"notification/set": (state, { kind, template }) => ({
		...state,
		notifications: setTemplate(state.notifications, kind, template),
	}),
	"payment/set": (state, { enabled }) =>
		enabled
			? {
					...state,
					payment: state.payment ?? {
						account: "",
						amount: { kind: "fixed", value: 0 },
					},
				}
			: { ...state, payment: undefined },
	"payment/update": (state, { patch }) =>
		state.payment
			? { ...state, payment: { ...state.payment, ...patch } }
			: state,
	reset: (_state, { definition }) => definition,
};
