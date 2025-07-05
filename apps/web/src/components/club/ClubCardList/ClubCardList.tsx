"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";
import { ClubCard } from "~/components/club/ClubCard";
import { useORPC } from "~/libs/orpc/react";

export default function ClubCardList() {
	const orpc = useORPC();

	const { data } = useSuspenseQuery(orpc.clubs.getAll.queryOptions());

	return (
		<div className="grid gap-4 md:grid-cols-2">
			{data?.data?.map((club) => (
				<ClubCard key={club.id} data={club} />
			))}
		</div>
	);
}

ClubCardList.Skeleton = function ClubCardListSkeleton() {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			{[1, 2, 3, 4].map((i) => (
				<ClubCard.Skeleton key={i} />
			))}
		</div>
	);
};
