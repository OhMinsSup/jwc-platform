import { Button } from "@jwc/ui/components/button";

import { formatCount, formatWon } from "../../../platform/format";
import type { PaymentSummary } from "../model/payment";

interface ReminderRule {
	firstAfterDays: number;
	intervalDays: number;
	maxCount: number;
}

interface PaymentTrackProps {
	/** 입금 계좌 (정의의 payment.account) */
	account: string;
	/** 옵션별 금액일 때 그 질문 이름 (예: "숙박 형태") */
	groupLabel: string | null;
	onShowUnpaid: () => void;
	reminder: ReminderRule | null;
	summary: PaymentSummary;
}

const PERCENT = 100;

/** 받은 비율 (0~100). 받을 금액이 0이면 0 */
function collectedPercent(summary: PaymentSummary): number {
	return summary.expected === 0
		? 0
		: (summary.collected / summary.expected) * PERCENT;
}

function reminderSentence(rule: ReminderRule | null): string {
	return rule
		? `미납자에게는 신청 ${rule.firstAfterDays}일 뒤부터 ${rule.intervalDays}일마다, 최대 ${rule.maxCount}번 안내 문자가 갑니다.`
		: "미입금 안내 문자는 설정되어 있지 않습니다.";
}

/** 머리 수치: 화면의 질문("누가 아직 안 냈나")에 답하는 가장 큰 숫자 */
function LeadFigure({ summary }: { summary: PaymentSummary }) {
	if (summary.unpaidCount === 0) {
		return (
			<p className="text-[30px] leading-tight font-semibold tracking-tight">
				모두 납입했습니다
			</p>
		);
	}
	return (
		<p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<span className="text-[30px] leading-tight font-semibold tracking-tight tabular-nums">
				미납 {formatCount(summary.unpaidCount)}
				<span className="text-muted-foreground ml-0.5 text-lg font-normal">
					명
				</span>
			</span>
			<span className="text-muted-foreground text-lg tabular-nums">
				{formatWon(summary.outstanding)} 남음
			</span>
		</p>
	);
}

/** 받은 금액 / 받을 금액 막대. 채운 길이 = 실제 비율, 양 끝에 라벨 */
function Track({ summary }: { summary: PaymentSummary }) {
	const percent = collectedPercent(summary);
	return (
		<div>
			{/* 보조기술용 원생 meter + 눈으로 보는 막대 (meter 기본 모양은 브라우저마다 달라 그리지 않는다) */}
			<meter
				aria-label={`받을 회비 ${formatWon(summary.expected)} 중 ${formatWon(summary.collected)} 받음`}
				className="sr-only"
				max={summary.expected}
				min={0}
				value={summary.collected}
			/>
			<div
				aria-hidden
				className="bg-brand-track h-2.5 overflow-hidden rounded-full"
			>
				<div
					className="bg-brand h-full rounded-full"
					style={{ width: `${percent}%` }}
				/>
			</div>
			<div className="mt-2 flex justify-between gap-4 text-[13px] tabular-nums">
				<span>
					받음 {formatWon(summary.collected)}
					<span className="text-muted-foreground">
						{" "}
						· {formatCount(summary.paidCount)}명
					</span>
				</span>
				<span className="text-right">
					전체 {formatWon(summary.expected)}
					<span className="text-muted-foreground">
						{" "}
						· {formatCount(summary.total)}명
					</span>
				</span>
			</div>
		</div>
	);
}

/** 옵션(숙박 형태 등)별 인원과 납입 인원: 고정 폭 작은 열 */
function Groups({
	summary,
	groupLabel,
}: {
	summary: PaymentSummary;
	groupLabel: string | null;
}) {
	if (groupLabel === null) {
		return null;
	}
	return (
		<div>
			<h3 className="text-muted-foreground mb-2 text-[13px]">{groupLabel}별</h3>
			<dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
				{summary.groups.map((group) => (
					<div key={group.label}>
						<dt className="text-sm font-medium">
							{group.label}
							{group.amount !== null && (
								<span className="text-muted-foreground ml-1.5 font-normal tabular-nums">
									{formatWon(group.amount)}
								</span>
							)}
						</dt>
						<dd className="text-muted-foreground text-[13px] tabular-nums">
							<span className="text-foreground">
								{formatCount(group.count)}명
							</span>{" "}
							중 납입 {formatCount(group.paidCount)}
						</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

/**
 * 회비 납입 현황 (이 제품만의 블록): 미납 인원/금액을 머리 수치로, 받은 비율을 막대로, 옵션별 인원을 작은 열로.
 * 가장 잦은 일(미납자 확인)로 바로 가는 버튼을 머리 줄에 둔다.
 */
export function PaymentTrack({
	summary,
	account,
	groupLabel,
	reminder,
	onShowUnpaid,
}: PaymentTrackProps) {
	return (
		<section
			aria-labelledby="payment-heading"
			className="bg-card space-y-5 rounded-xl border p-5"
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="space-y-1">
					<h2 className="text-base font-semibold" id="payment-heading">
						회비 납입
					</h2>
					<LeadFigure summary={summary} />
				</div>
				{summary.unpaidCount > 0 && (
					<Button onClick={onShowUnpaid} size="sm" variant="outline">
						미납 {formatCount(summary.unpaidCount)}명만 보기
					</Button>
				)}
			</div>
			<Track summary={summary} />
			<Groups groupLabel={groupLabel} summary={summary} />
			<p className="text-muted-foreground border-t pt-4 text-[13px]">
				입금 계좌 <span className="text-foreground">{account}</span>
				<span aria-hidden> · </span>
				{reminderSentence(reminder)}
			</p>
		</section>
	);
}
