"use node";

/**
 * Solapi SMS 클라이언트
 *
 * 구조화된 타입과 빌더 패턴으로 DX를 개선한 Solapi 래퍼
 *
 * @example
 * ```ts
 * const sms = createSolapiClient({
 *   apiKey: "your-api-key",
 *   apiSecret: "your-api-secret",
 *   defaultSender: "01012345678",
 * });
 *
 * // 단문 메시지 발송
 * await sms.send({
 *   to: "01098765432",
 *   text: "안녕하세요!",
 * });
 *
 * // 템플릿 메시지 발송
 * await sms.sendTemplate("onboarding-welcome", {
 *   to: "01098765432",
 *   variables: { name: "홍길동" },
 * });
 * ```
 */

import { SolapiMessageService } from "solapi";

// ============================================================
// Types
// ============================================================

/** Solapi 클라이언트 설정 */
export interface SolapiClientConfig {
	/** API 키 */
	apiKey: string;
	/** API 시크릿 */
	apiSecret: string;
	/** 기본 발신번호 (01012345678 형식) */
	defaultSender: string;
}

/** 기본 메시지 옵션 */
export interface BaseMessageOptions {
	/** 수신번호 (01012345678 형식) */
	to: string;
	/** 발신번호 (미지정 시 기본값 사용) */
	from?: string;
}

/** SMS 메시지 옵션 */
export interface SmsMessageOptions extends BaseMessageOptions {
	/** 메시지 본문 (SMS: 한글 45자/영자 90자 이하) */
	text: string;
}

/** LMS 메시지 옵션 */
export interface LmsMessageOptions extends BaseMessageOptions {
	/** 메시지 본문 (LMS: 한글 45자/영자 90자 초과) */
	text: string;
	/** 메시지 제목 (선택) */
	subject?: string;
}

/** 예약 발송 옵션 */
export interface ScheduleOptions {
	/** 예약 발송 시간 (Date 또는 'YYYY-MM-DD HH:mm:ss' 형식) */
	scheduledDate: Date | string;
}

/** 메시지 발송 결과 */
export interface SendResult {
	/** 그룹 ID */
	groupId: string;
	/** 메시지 ID 목록 */
	messageIds: string[];
	/** 성공 여부 */
	success: boolean;
}

/** 템플릿 변수 */
export type TemplateVariables = Record<string, string>;

/** 템플릿 메시지 옵션 */
export interface TemplateMessageOptions extends BaseMessageOptions {
	/** 템플릿 변수 */
	variables?: TemplateVariables;
}

/** 메시지 템플릿 정의 */
export interface MessageTemplate {
	/** 템플릿 이름 (관리용) */
	name: string;
	/** 메시지 본문 (변수는 {{변수명}} 형식) */
	text: string;
	/** 메시지 제목 (LMS/MMS용, 선택) */
	subject?: string;
}

/** 미리 정의된 템플릿 ID */
export type TemplateId =
	| "onboarding-welcome"
	| "onboarding-update"
	| "payment-reminder"
	| (string & {});

/** 템플릿 레지스트리 */
export const MESSAGE_TEMPLATES: Record<string, MessageTemplate> = {
	"onboarding-welcome": {
		name: "온보딩 환영 메시지",
		text: `[죽전우리교회 청년부]\n
{{name}}님, 수련회 신청완료\n
금액: {{amount}}원 ({{stayType}})\n
계좌: {{accountInfo}}\n
{{siteUrl}}
`,
	},
	"onboarding-update": {
		name: "신청 정보 수정 알림",
		text: `[죽전우리교회 청년부]\n
{{name}}님, 수정완료.\n
금액: {{amount}}원 ({{stayType}})\n
계좌: {{accountInfo}}\n
{{siteUrl}}
`,
	},
	"payment-reminder": {
		name: "미입금 알림",
		text: `[죽전우리교회 청년부]\n
{{name}}님, 회비 입금이 확인되지 않았습니다.\n
[입금 안내]
금액: {{amount}}원 ({{stayType}})\n
계좌: {{accountInfo}}\n
{{siteUrl}}
`,
	},
};

/**
 * 전화번호 정규화 (하이픈 제거)
 */
export function normalizePhoneNumber(phone: string): string {
	return phone.replace(/[^0-9]/g, "");
}

/**
 * 템플릿 문자열에 변수 치환
 */
export function interpolateTemplate(
	template: string,
	variables: TemplateVariables
): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
}

/**
 * 메시지 타입 자동 판별 (SMS vs LMS)
 */
export function getMessageType(text: string): "SMS" | "LMS" {
	// 한글 바이트 계산 (한글 2바이트, 영문 1바이트)
	const byteLength = [...text].reduce((acc, char) => {
		const code = char.charCodeAt(0);
		return acc + (code > 127 ? 2 : 1);
	}, 0);

	// SMS: 90바이트 이하, LMS: 90바이트 초과
	return byteLength <= 90 ? "SMS" : "LMS";
}

// ============================================================
// Solapi Client
// ============================================================

export interface SolapiClient {
	/** 단순 메시지 발송 */
	send(options: SmsMessageOptions): Promise<SendResult>;

	/** LMS 메시지 발송 (제목 포함) */
	sendLms(options: LmsMessageOptions): Promise<SendResult>;

	/** 템플릿 기반 메시지 발송 */
	sendTemplate(
		templateId: TemplateId,
		options: TemplateMessageOptions
	): Promise<SendResult>;

	/** 예약 발송 */
	sendScheduled(
		options: SmsMessageOptions,
		schedule: ScheduleOptions
	): Promise<SendResult>;

	/** 여러 수신자에게 동일 메시지 발송 */
	sendBulk(
		recipients: string[],
		text: string,
		from?: string
	): Promise<SendResult>;

	/** 내부 서비스 인스턴스 접근 (고급 사용) */
	readonly service: SolapiMessageService;
}

/**
 * Solapi 클라이언트 생성
 */
export function createSolapiClient(config: SolapiClientConfig): SolapiClient {
	const service = new SolapiMessageService(config.apiKey, config.apiSecret);
	const defaultFrom = normalizePhoneNumber(config.defaultSender);

	const parseResponse = (response: unknown): SendResult => {
		const res = response as {
			groupId?: string;
			messageId?: string;
			to?: string;
		};
		return {
			groupId: res.groupId ?? "",
			messageIds: res.messageId ? [res.messageId] : [],
			success: true,
		};
	};

	return {
		service,

		async send(options) {
			const response = await service.send({
				to: normalizePhoneNumber(options.to),
				from: options.from ? normalizePhoneNumber(options.from) : defaultFrom,
				text: options.text,
			});
			return parseResponse(response);
		},

		async sendLms(options) {
			const response = await service.send({
				to: normalizePhoneNumber(options.to),
				from: options.from ? normalizePhoneNumber(options.from) : defaultFrom,
				text: options.text,
				subject: options.subject,
			});
			return parseResponse(response);
		},

		sendTemplate(templateId, options) {
			const template = MESSAGE_TEMPLATES[templateId];
			if (!template) {
				throw new Error(`Template not found: ${templateId}`);
			}

			const text = interpolateTemplate(template.text, options.variables ?? {});
			const messageType = getMessageType(text);

			if (messageType === "LMS" || template.subject) {
				return this.sendLms({
					to: options.to,
					from: options.from,
					text,
					subject: template.subject
						? interpolateTemplate(template.subject, options.variables ?? {})
						: undefined,
				});
			}

			return this.send({
				to: options.to,
				from: options.from,
				text,
			});
		},

		async sendScheduled(options, schedule) {
			const scheduledDateStr =
				schedule.scheduledDate instanceof Date
					? schedule.scheduledDate.toISOString()
					: schedule.scheduledDate;

			const response = await service.send(
				{
					to: normalizePhoneNumber(options.to),
					from: options.from ? normalizePhoneNumber(options.from) : defaultFrom,
					text: options.text,
				},
				{ scheduledDate: scheduledDateStr }
			);
			return parseResponse(response);
		},

		async sendBulk(recipients, text, from) {
			const messages = recipients.map((to) => ({
				to: normalizePhoneNumber(to),
				from: from ? normalizePhoneNumber(from) : defaultFrom,
				text,
			}));

			const response = await service.send(messages);
			return parseResponse(response);
		},
	};
}

let _cachedClient: SolapiClient | null = null;

/**
 * 환경변수에서 Solapi 클라이언트 생성 (싱글톤)
 *
 * 환경변수:
 * - SOLAPI_API_KEY
 * - SOLAPI_API_SECRET
 * - SOLAPI_SENDER_PHONE
 */
export function getSolapiClient(): SolapiClient {
	if (_cachedClient) {
		return _cachedClient;
	}

	const apiKey = process.env.SOLAPI_API_KEY;
	const apiSecret = process.env.SOLAPI_API_SECRET;
	const senderPhone = process.env.SOLAPI_SENDER_PHONE;

	if (!apiKey) {
		throw new Error("Missing environment variable: SOLAPI_API_KEY");
	}
	if (!apiSecret) {
		throw new Error("Missing environment variable: SOLAPI_API_SECRET");
	}
	if (!senderPhone) {
		throw new Error("Missing environment variable: SOLAPI_SENDER_PHONE");
	}

	_cachedClient = createSolapiClient({
		apiKey,
		apiSecret,
		defaultSender: senderPhone,
	});

	return _cachedClient;
}

/**
 * 캐시된 클라이언트 초기화 (테스트용)
 */
export function resetSolapiClient(): void {
	_cachedClient = null;
}
