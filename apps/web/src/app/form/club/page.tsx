import { ClubListPage } from "~/components/club/ClubListPage";
import { HydrateClient, orpc, prefetch } from "~/libs/orpc/server";

// 이 페이지는 동적으로 렌더링되어야 합니다 (클라이언트 컴포넌트 포함)
export const dynamic = "force-dynamic";

export default async function Page() {
	await prefetch(orpc.clubs.getAll.queryOptions());

	return (
		<HydrateClient>
			<ClubListPage />
		</HydrateClient>
	);
}
