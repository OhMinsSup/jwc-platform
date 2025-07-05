import React from "react";
import { ClubSuccess } from "~/components/club/ClubSuccess";

interface SuccessPageProps {
	params: Promise<{ id: string }>;
}

export default async function ClubApplicationSuccessPage({
	params,
}: SuccessPageProps) {
	const { id } = await params;

	return <ClubSuccess id={id} />;
}
