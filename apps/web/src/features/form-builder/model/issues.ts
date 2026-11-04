import { parseFormDefinition } from "@jwc/form-core/definition/definition";
import type { FormDefinition } from "@jwc/form-core/definition/definition";

/** 설정 탭의 구역. 오류를 해당 카드 옆에 표시하기 위한 분류 키 */
export type SettingsSection = "basic" | "identity" | "sms" | "payment";

export interface IssueIndex {
	byField: ReadonlyMap<string, readonly string[]>;
	byPage: ReadonlyMap<string, readonly string[]>;
	bySection: ReadonlyMap<SettingsSection, readonly string[]>;
	/** 질문 탭(질문 + 페이지) 오류 수 — 탭 배지용 */
	questionCount: number;
	total: number;
}

/** 경로의 속성 이름 → 사람이 읽는 이름. 메시지 앞에 붙여 "어느 칸"인지 알린다 */
const PROPERTY_LABELS: Record<string, string> = {
	label: "질문 제목",
	id: "질문 ID",
	title: "제목",
	description: "설명",
	columnHeader: "시트 열 이름",
	placeholder: "입력 예시",
	showIf: "표시 조건",
	options: "선택지",
	fieldIds: "질문 배치",
	minLength: "최소 글자 수",
	maxLength: "최대 글자 수",
	min: "최솟값",
	max: "최댓값",
	minSelect: "최소 선택 수",
	maxSelect: "최대 선택 수",
	stepMinutes: "시간 간격",
	trueLabel: "'예' 문구",
	falseLabel: "'아니오' 문구",
	account: "입금 계좌",
	value: "금액",
	amounts: "선택지별 금액",
	reminder: "미입금 알림",
	onCreate: "신청 완료 알림",
	onUpdate: "수정 완료 알림",
	onReminder: "미입금 알림 문구",
	closesAt: "마감 일시",
	timezone: "시간대",
	completionMessage: "완료 안내 문구",
	fieldId: "기준 질문",
	phoneFieldId: "수신 번호 질문",
};

const SECTION_OF_ROOT: Record<string, SettingsSection> = {
	identity: "identity",
	contact: "sms",
	notifications: "sms",
	payment: "payment",
};

type Path = readonly string[];

/** 가장 바깥쪽의 알려진 속성 이름을 쓴다 (options.0.label → "선택지", showIf.conditions.0 → "표시 조건") */
function describe(path: Path, message: string): string {
	const key = path.find((segment) => PROPERTY_LABELS[segment]);
	const label = key ? PROPERTY_LABELS[key] : undefined;
	return label ? `${label}: ${message}` : message;
}

function push<K>(map: Map<K, string[]>, key: K, message: string): void {
	const list = map.get(key);
	if (list) {
		list.push(message);
	} else {
		map.set(key, [message]);
	}
}

/** 경로가 root(fields/pages)의 position번째 항목을 가리키면 그 항목의 id */
function idAtPath(
	items: readonly { id: string }[],
	expectedRoot: string,
	root: string,
	position: string,
): string | undefined {
	return root === expectedRoot ? items[Number(position)]?.id : undefined;
}

/**
 * 검증 결과를 "누가 표시할지" 기준으로 한 번에 분류한다.
 * 각 카드는 자기 키로 조회만 하므로, 오류가 없는 카드는 undefined를 받아 리렌더되지 않는다.
 */
function indexIssues(
	definition: FormDefinition,
	issues: readonly { path: string; message: string }[],
): IssueIndex {
	const byField = new Map<string, string[]>();
	const byPage = new Map<string, string[]>();
	const bySection = new Map<SettingsSection, string[]>();
	let questionCount = 0;
	for (const issue of issues) {
		const [root = "", position = "", ...rest] = issue.path.split(".");
		const fieldId = idAtPath(definition.fields, "fields", root, position);
		const pageId = idAtPath(definition.pages, "pages", root, position);
		if (fieldId !== undefined) {
			push(byField, fieldId, describe(rest, issue.message));
			questionCount += 1;
		} else if (pageId === undefined) {
			const section = SECTION_OF_ROOT[root] ?? "basic";
			push(
				bySection,
				section,
				describe([root, position, ...rest], issue.message),
			);
		} else {
			push(byPage, pageId, describe(rest, issue.message));
			questionCount += 1;
		}
	}
	return { total: issues.length, byField, byPage, bySection, questionCount };
}

export function validateDefinition(definition: FormDefinition): IssueIndex {
	const parsed = parseFormDefinition(definition);
	return indexIssues(definition, parsed.ok ? [] : parsed.issues);
}
