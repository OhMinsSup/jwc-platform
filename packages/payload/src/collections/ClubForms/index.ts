import { authenticated } from "@jwc/payload/access/authenticated";
import { decryptFieldValue } from "@jwc/payload/hooks/decryptFieldValue";
import { encryptFieldValue } from "@jwc/payload/hooks/encryptFieldValue";
import type { CollectionConfig } from "payload";

export const ClubForms: CollectionConfig = {
	slug: "clubForms",
	access: {
		create: authenticated,
		delete: authenticated,
		update: authenticated,
		read: authenticated,
	},
	labels: {
		singular: {
			en: "Club",
			ko: "동아리 신청서",
		},
		plural: {
			en: "Clubs",
			ko: "동아리 신청서 목록",
		},
	},
	admin: {
		useAsTitle: "name",
		components: {
			beforeListTable: [
				{
					path: "@jwc/payload/components/ClubFormBeforeListTable#ClubFormBeforeListTable",
				},
			],
		},
	},
	fields: [
		{
			name: "name",
			label: {
				ko: "이름",
				en: "Name",
			},
			type: "text",
			admin: {
				placeholder: {
					ko: "이름을 입력해주세요",
					en: "Please enter your name",
				},
				readOnly: true,
			},
			required: true,
			maxLength: 100,
			hooks: {
				afterRead: [decryptFieldValue],
				beforeChange: [encryptFieldValue],
			},
		},
		{
			name: "phone",
			label: {
				ko: "전화번호",
				en: "Phone",
			},
			type: "text",
			admin: {
				placeholder: {
					ko: "전화번호를 입력해주세요",
					en: "Please enter your phone number",
				},
				readOnly: true,
			},
			hooks: {
				afterRead: [decryptFieldValue],
				beforeChange: [encryptFieldValue],
			},
			required: true,
		},
		{
			name: "department",
			label: {
				ko: "부서",
				en: "Department",
			},
			type: "select",
			options: [
				{
					label: {
						ko: "청년 1부",
						en: "Youth 1st",
					},
					value: "청년1부",
				},
				{
					label: {
						ko: "청년 2부",
						en: "Youth 2nd",
					},
					value: "청년2부",
				},
				{
					label: {
						ko: "기타",
						en: "Other",
					},
					value: "기타",
				},
			],
			required: true,
		},
		{
			name: "club",
			label: {
				ko: "동아리",
				en: "Club",
			},
			type: "relationship",
			relationTo: "clubs",
			required: true,
		},
		{
			name: "ageGroup",
			label: {
				ko: "또래",
				en: "Age",
			},
			type: "text",
			required: true,
		},
		{
			name: "data",
			label: {
				ko: "데이터",
				en: "Data",
			},
			type: "json",
		},
	],
};
