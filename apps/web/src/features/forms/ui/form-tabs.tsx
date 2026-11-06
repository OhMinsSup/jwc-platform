import { cn } from "@jwc/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { Eye, Inbox, PenLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FormTabPath =
	| "/admin/forms/$formId"
	| "/admin/forms/$formId/preview"
	| "/admin/forms/$formId/submissions";

/** 폼 안의 화면들. 화면이 늘면 이 표에 한 줄 추가한다 */
const FORM_TABS: readonly {
	to: FormTabPath;
	label: string;
	icon: LucideIcon;
	/** 발행 버전이 있어야 열리는 화면 */
	requiresPublished?: boolean;
}[] = [
	{ to: "/admin/forms/$formId", label: "편집", icon: PenLine },
	{ to: "/admin/forms/$formId/preview", label: "미리보기", icon: Eye },
	{
		to: "/admin/forms/$formId/submissions",
		label: "응답",
		icon: Inbox,
		requiresPublished: true,
	},
];

const TAB_CLASS =
	"-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-transparent border-b-2 px-1 pt-1 pb-2.5 font-medium text-muted-foreground text-sm transition-colors";

/** 링크 기반 탭 (주소가 바뀌므로 새로고침·뒤로가기·새 탭 열기가 그대로 동작) */
export function FormTabs({
	formId,
	published,
}: {
	formId: string;
	published: boolean;
}) {
	return (
		<nav aria-label="폼 화면" className="overflow-x-auto border-b">
			<ul className="flex gap-6">
				{FORM_TABS.map(({ to, label, icon: Icon, requiresPublished }) => (
					<li key={to}>
						{requiresPublished && !published ? (
							<span
								aria-disabled
								className={cn(TAB_CLASS, "cursor-not-allowed opacity-50")}
								title="발행한 뒤에 볼 수 있습니다"
							>
								<Icon aria-hidden className="h-4 w-4" />
								{label}
								<span className="sr-only">(발행 후 사용 가능)</span>
							</span>
						) : (
							<Link
								activeOptions={{ exact: true }}
								className={cn(
									TAB_CLASS,
									"hover:text-foreground data-[status=active]:border-foreground data-[status=active]:text-foreground",
								)}
								params={{ formId }}
								to={to}
							>
								<Icon aria-hidden className="h-4 w-4" />
								{label}
							</Link>
						)}
					</li>
				))}
			</ul>
		</nav>
	);
}
