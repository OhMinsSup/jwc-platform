import { ClubPage } from "~/components/club/ClubPage";
import { HydrateClient, orpc, prefetch } from "~/libs/orpc/server";

// 이 페이지는 동적으로 렌더링되어야 합니다 (데이터 fetching 포함)
export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
	const { id } = await params;

	prefetch(
		orpc.clubs.getById.queryOptions({
			input: { id },
		})
	);

	return (
		<HydrateClient>
			<ClubPage id={id} />
		</HydrateClient>
	);
}
