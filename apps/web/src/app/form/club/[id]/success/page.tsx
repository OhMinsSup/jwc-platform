import React from "react";
import { ClubSuccess } from "~/components/club/ClubSuccess";

// 성공 페이지도 동적으로 렌더링
export const dynamic = "force-dynamic";

interface SuccessPageProps {
	params: Promise<{ id: string }>;
}

export default async function ClubApplicationSuccessPage({
	params,
}: SuccessPageProps) {
	const { id } = await params;

	return <ClubSuccess id={id} />;
}
