import { ClubListPage } from "~/components/club/ClubListPage";
import { HydrateClient, orpc, prefetch } from "~/libs/orpc/server";

export default function Page() {
	prefetch(orpc.clubs.getAll.queryOptions());

	return (
		<HydrateClient>
			<ClubListPage />
		</HydrateClient>
	);
}
