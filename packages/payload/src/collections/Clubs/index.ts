import { authenticated } from "@jwc/payload/access/authenticated";
import type { CollectionConfig } from "payload";

export const Clubs: CollectionConfig = {
	slug: "clubs",
	access: {
		create: authenticated,
		delete: authenticated,
		update: authenticated,
		read: authenticated,
	},
	labels: {
		singular: {
			en: "Club",
			ko: "동아리",
		},
		plural: {
			en: "Clubs",
			ko: "동아리 목록",
		},
	},
	admin: {
		useAsTitle: "title",
	},
	fields: [
		{
			name: "title",
			label: {
				ko: "동아리 제목",
				en: "Title",
			},
			type: "text",
			admin: {
				placeholder: {
					ko: "동아리 제목을 입력해주세요",
					en: "Please enter your title",
				},
			},
			required: true,
			maxLength: 250,
		},
		{
			name: "components",
			label: {
				ko: "컴포넌트",
				en: "Components",
			},
			type: "relationship",
			relationTo: "components",
			hasMany: true,
		},
		{
			name: "clubForms",
			label: {
				ko: "동아리 신청서",
				en: "Club Forms",
			},
			type: "relationship",
			relationTo: "clubForms",
			hasMany: true,
		},
		{
			name: "content",
			label: {
				ko: "내용",
				en: "Content",
			},
			type: "richText",
		},
	],
};
