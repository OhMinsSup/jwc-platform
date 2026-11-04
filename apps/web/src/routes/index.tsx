import { Button } from "@jwc/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { listOpenFormsFn } from "../features/forms/functions/public";
import { PublicShell } from "../platform/ui/public-shell";

export const Route = createFileRoute("/")({
	loader: () => listOpenFormsFn(),
	component: HomePage,
});

function HomePage() {
	const forms = Route.useLoaderData();
	return (
		<PublicShell>
			<h1 className="mb-2 text-3xl font-bold">접수 중인 신청서</h1>
			<p className="text-muted-foreground mb-8">참여할 행사를 선택해주세요.</p>
			{forms.length === 0 && (
				<p className="text-muted-foreground rounded-xl border p-6 text-center">
					현재 접수 중인 신청서가 없습니다.
				</p>
			)}
			<ul className="space-y-3">
				{forms.map((form) => (
					<li className="rounded-xl border p-5" key={form.slug}>
						<h2 className="text-lg font-semibold">{form.title}</h2>
						{form.description && (
							<p className="text-muted-foreground mt-1 text-sm">
								{form.description}
							</p>
						)}
						<Button
							className="mt-4"
							nativeButton={false}
							render={<Link params={{ slug: form.slug }} to="/f/$slug" />}
							size="sm"
						>
							신청하기
							<ArrowRight className="ml-1 h-4 w-4" />
						</Button>
					</li>
				))}
			</ul>
		</PublicShell>
	);
}
