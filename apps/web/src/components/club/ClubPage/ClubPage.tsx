"use client";

import { Suspense } from "react";
import ClubSelection from "../ClubSelection/ClubSelection";

interface ClubPageProps {
	id: string;
}

export default function ClubPage({ id }: ClubPageProps) {
	return (
		<Suspense fallback={<div>로딩 중...</div>}>
			<ClubSelection id={id} />
		</Suspense>
	);
}
