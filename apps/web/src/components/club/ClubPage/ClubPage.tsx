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
			<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
				<title>목록</title>
				<path d="M3,5H9V11H3V5M5,7V9H7V7H5M11,7H21V9H11V7M11,15H21V17H11V15M5,20L1.5,16.5L2.91,15.09L5,17.18L9.59,12.59L11,14L5,20Z" />
			</svg>
		</Suspense>
	);
}
