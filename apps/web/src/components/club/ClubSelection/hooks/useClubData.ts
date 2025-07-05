import {
	type DynamicComponent,
	createDynamicClubFormSchema,
} from "@jwc/schema";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useORPC } from "~/libs/orpc/react";
import type { Component as ClubComponent } from "~/types/club";
import { extractTextFromRichText } from "../utils";

/**
 * 클럽 데이터를 가져오는 훅
 */
export const useClubData = (id: string | number) => {
	const orpc = useORPC();

	const { data: clubResponse } = useSuspenseQuery(
		orpc.clubs.getById.queryOptions({ input: { id } })
	);

	const club = useMemo(() => clubResponse?.data, [clubResponse?.data]);
	const components = useMemo(() => club?.components || [], [club?.components]);
	const clubDescription = useMemo(
		() => extractTextFromRichText(club?.content),
		[club?.content]
	);

	return { club, components, clubDescription };
};

/**
 * 동적 스키마를 생성하는 훅
 */
export const useDynamicSchema = (components: ClubComponent[]) => {
	return useMemo(() => {
		// ClubComponent를 DynamicComponent로 변환
		const dynamicComponents: DynamicComponent[] = components.map(
			(component) => ({
				id: component.id,
				title: component.title,
				type: component.type,
				description: component.description,
				data: component.data,
			})
		);

		// 동적 스키마 생성
		return createDynamicClubFormSchema(dynamicComponents);
	}, [components]);
};
