import { columnHeaderOf, isChoiceField, isDisplayOnly } from "./fields";
import type { DefinitionShape, IntegrityIssue } from "./integrity-types";
import { SYSTEM_COLUMN_HEADERS } from "./system-columns";

type Notifications = DefinitionShape["notifications"];

/** 빈 문자열 템플릿은 설정되지 않은 것으로 본다 */
function hasTemplate(template: string | undefined): boolean {
	return template !== undefined && template !== "";
}

function hasAnyTemplate(notifications: Notifications): boolean {
	return (
		hasTemplate(notifications?.onCreate) ||
		hasTemplate(notifications?.onUpdate) ||
		hasTemplate(notifications?.onReminder)
	);
}

/** 알림/결제 설정 간 상호 의존성 */
export function checkNotifications(
	definition: DefinitionShape,
): IntegrityIssue[] {
	const { notifications } = definition;
	const hasReminderTemplate = hasTemplate(notifications?.onReminder);
	const hasReminderRule = Boolean(definition.payment?.reminder);
	const issues: IntegrityIssue[] = [];
	if (hasAnyTemplate(notifications) && !definition.contact) {
		issues.push({
			path: ["contact"],
			message: "알림을 보내려면 contact.phoneFieldId가 필요합니다",
		});
	}
	if (hasReminderRule && !hasReminderTemplate) {
		issues.push({
			path: ["notifications", "onReminder"],
			message: "미입금 알림 규칙에는 onReminder 템플릿이 필요합니다",
		});
	}
	if (hasReminderTemplate && !hasReminderRule) {
		issues.push({
			path: ["payment", "reminder"],
			message: "onReminder 템플릿에는 payment.reminder 규칙이 필요합니다",
		});
	}
	return issues;
}

export function checkFieldRules(definition: DefinitionShape): IntegrityIssue[] {
	const issues: IntegrityIssue[] = [];
	const headers = new Set<string>(SYSTEM_COLUMN_HEADERS);
	for (const [index, field] of definition.fields.entries()) {
		if (isDisplayOnly(field)) {
			if (field.required) {
				issues.push({
					path: ["fields", index, "required"],
					message: "안내문(statement)은 필수일 수 없습니다",
				});
			}
			continue;
		}
		const header = columnHeaderOf(field);
		if (headers.has(header)) {
			issues.push({
				path: ["fields", index, "columnHeader"],
				message: `시트 헤더 중복: ${header}`,
			});
		}
		headers.add(header);
		if (
			isChoiceField(field) &&
			new Set(field.options.map((o) => o.value)).size !== field.options.length
		) {
			issues.push({
				path: ["fields", index, "options"],
				message: "옵션 값이 중복됩니다",
			});
		}
	}
	return issues;
}
