import { Callout } from "@jwc/ui-patterns/components/callout";
import { EmptyState } from "@jwc/ui-patterns/components/empty-state";
import { PageHeader } from "@jwc/ui-patterns/components/page-header";
import { createFileRoute } from "@tanstack/react-router";
import { History, MailPlus } from "lucide-react";
import type { ReactNode } from "react";

import {
	listAuditFn,
	listInvitesFn,
} from "../../../features/admin-access/functions";
import {
	AuditTable,
	InvitesTable,
} from "../../../features/admin-access/ui/admin-access-tables";
import { InviteForm } from "../../../features/admin-access/ui/invite-form";

/** 관리자 초대와 최근 활동(감사 기록). 두 목록은 따로 실패할 수 있어 결과 값 그대로 받는다 */
export const Route = createFileRoute("/admin/_console/admins")({
	head: () => ({ meta: [{ title: "관리자 · JWC 신청서" }] }),
	loader: async () => {
		const [invites, audit] = await Promise.all([
			listInvitesFn(),
			listAuditFn(),
		]);
		return { invites, audit };
	},
	component: AdminsPage,
});

function Section({
	title,
	headingId,
	children,
}: {
	title: string;
	headingId: string;
	children: ReactNode;
}) {
	return (
		<section aria-labelledby={headingId} className="space-y-3">
			<h2 className="text-lg font-semibold" id={headingId}>
				{title}
			</h2>
			{children}
		</section>
	);
}

function LoadError({ message }: { message: string }) {
	return (
		<Callout role="alert" tone="danger">
			{message}
		</Callout>
	);
}

function InvitesSection() {
	const { invites } = Route.useLoaderData();
	if (!invites.ok) {
		return <LoadError message={invites.message} />;
	}
	return invites.data.length === 0 ? (
		<EmptyState
			description="위에서 이메일을 입력하면 1회용 초대 코드가 만들어집니다."
			icon={MailPlus}
			title="아직 발급한 초대가 없습니다"
		/>
	) : (
		<InvitesTable invites={invites.data} />
	);
}

function AuditSection() {
	const { audit } = Route.useLoaderData();
	if (!audit.ok) {
		return <LoadError message={audit.message} />;
	}
	return audit.data.length === 0 ? (
		<EmptyState
			description="폼 생성·발행, 접수 상태와 납입 변경, 초대와 가입이 여기에 기록됩니다."
			icon={History}
			title="아직 기록된 활동이 없습니다"
		/>
	) : (
		<AuditTable entries={audit.data} />
	);
}

function AdminsPage() {
	return (
		<div className="space-y-8">
			<PageHeader
				description="새 관리자를 초대하고, 관리자 작업 기록을 확인합니다."
				title="관리자"
			/>
			<Section headingId="invite-heading" title="관리자 초대">
				<InviteForm />
				<InvitesSection />
			</Section>
			<Section headingId="audit-heading" title="최근 활동">
				<AuditSection />
			</Section>
		</div>
	);
}
