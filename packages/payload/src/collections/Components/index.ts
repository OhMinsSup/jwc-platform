import { authenticated } from "@jwc/payload/access/authenticated";
import type { CollectionConfig } from "payload";

export const Components: CollectionConfig = {
	slug: "components",
	access: {
		create: authenticated,
		delete: authenticated,
		update: authenticated,
		read: authenticated,
	},
	labels: {
		singular: {
			en: "Component",
			ko: "컴포넌트",
		},
		plural: {
			en: "Components",
			ko: "컴포넌트 목록",
		},
	},
	admin: {
		useAsTitle: "title",
	},
	fields: [
		{
			name: "title",
			label: {
				ko: "타이틀",
				en: "Title",
			},
			type: "text",
			admin: {
				placeholder: {
					ko: "제목을 입력해주세요",
					en: "Please enter your title",
				},
			},
			required: true,
			maxLength: 250,
		},
		{
			name: "type",
			label: {
				ko: "타입",
				en: "Type",
			},
			type: "select",
			options: [
				{
					label: {
						ko: "Input 컴포넌트",
						en: "Input Component",
					},
					value: "text",
				},
				{
					label: {
						ko: "Select 컴포넌트",
						en: "Select Component",
					},
					value: "select",
				},
				{
					label: {
						ko: "Rich Text 컴포넌트",
						en: "Rich Text Component",
					},
					value: "richText",
				},
				{
					label: {
						ko: "Description 컴포넌트",
						en: "Description Component",
					},
					value: "description",
				},
				{
					label: {
						ko: "Checkbox 컴포넌트",
						en: "Checkbox Component",
					},
					value: "checkbox",
				},
				{
					label: {
						ko: "Radio 컴포넌트",
						en: "Radio Component",
					},
					value: "radio",
				},
			],
			required: true,
		},
		{
			name: "description",
			label: {
				ko: "설명",
				en: "Description",
			},
			type: "text",
			admin: {
				placeholder: {
					ko: "설명을 입력해주세요",
					en: "Please enter your description",
				},
			},
			maxLength: 500,
		},
		{
			name: "data",
			label: {
				ko: "데이터",
				en: "Data",
			},
			type: "json",
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
