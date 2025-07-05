import { ClubPage } from "~/components/club/ClubPage";
import { HydrateClient, orpc, prefetch } from "~/libs/orpc/server";

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
