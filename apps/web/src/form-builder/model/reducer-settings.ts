import type {
	FormDefinition,
	NotificationKind,
	ReminderRule,
} from "@jwc/form-core";

import type { SettingsAction } from "./actions";

/** 기능을 켤 때 채워 넣는 시작 문구. 운영 데이터가 아니라 편집 편의용 초기값이다. */
export const DEFAULT_TEMPLATES: Record<NotificationKind, string> = {
	onCreate: "[{{title}}]\n신청이 완료되었습니다.\n{{link}}",
	onUpdate: "[{{title}}]\n신청 내용이 수정되었습니다.\n{{link}}",
	onReminder:
		"[{{title}}]\n회비 입금이 아직 확인되지 않았습니다.\n금액: {{amount}}원\n계좌: {{account}}\n{{link}}",
};

const DEFAULT_REMINDER: ReminderRule = {
	firstAfterDays: 3,
	intervalDays: 7,
	maxCount: 3,
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

function withoutReminder(state: State): State {
	const payment = state.payment && { ...state.payment, reminder: undefined };
	return {
		...state,
		payment,
		notifications: setTemplate(state.notifications, "onReminder", null),
	};
}

/**
 * SMS 끄기 = 수신 번호, 모든 알림, 미입금 알림 규칙을 함께 해제.
 * 서로 의존하는 설정을 한 번에 바꿔 무결성 오류 조합이 생기지 않게 한다.
 */
const setSms: Handler<"sms/set"> = (state, { phoneFieldId }) => {
	if (phoneFieldId === null) {
		return {
			...withoutReminder(state),
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

/** 미입금 알림 = 발송 규칙 + onReminder 문구. 항상 쌍으로 켜고 끈다. */
const setReminder: Handler<"reminder/set"> = (state, { enabled }) => {
	if (!enabled) {
		return withoutReminder(state);
	}
	if (!(state.payment && state.contact)) {
		return state;
	}
	return {
		...state,
		payment: {
			...state.payment,
			reminder: state.payment.reminder ?? DEFAULT_REMINDER,
		},
		notifications: setTemplate(
			state.notifications,
			"onReminder",
			state.notifications?.onReminder ?? DEFAULT_TEMPLATES.onReminder,
		),
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
			: { ...withoutReminder(state), payment: undefined },
	"payment/update": (state, { patch }) =>
		state.payment
			? { ...state, payment: { ...state.payment, ...patch } }
			: state,
	"reminder/set": setReminder,
	"reminder/update": (state, { patch }) => {
		const reminder = state.payment?.reminder;
		if (!(state.payment && reminder)) {
			return state;
		}
		return {
			...state,
			payment: { ...state.payment, reminder: { ...reminder, ...patch } },
		};
	},
	reset: (_state, { definition }) => definition,
};
