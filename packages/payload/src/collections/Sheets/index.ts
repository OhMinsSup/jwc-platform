import { admins } from "@jwc/payload/access/admins";
import { authenticated } from "@jwc/payload/access/authenticated";
import type { CollectionConfig } from "payload";

export const Sheets: CollectionConfig = {
	slug: "sheets",
	access: {
		create: admins,
		delete: admins,
		update: admins,
		read: authenticated,
	},
	labels: {
		singular: {
			en: "Sheet",
			ko: "구글 시트",
		},
		plural: {
			en: "Sheets",
			ko: "구글 시트 목록",
		},
	},
	fields: [
		{
			name: "fileId",
			type: "text",
			label: {
				en: "File ID",
				ko: "파일 ID",
			},
			admin: {
				readOnly: true,
				placeholder: {
					ko: "파일 ID를 입력해주세요",
					en: "Please enter your name",
				},
			},
		},
		{
			name: "kind",
			type: "text",
			label: {
				en: "Kind",
				ko: "종류",
			},
			admin: {
				readOnly: true,
			},
		},
		{
			name: "mimeType",
			type: "text",
			label: {
				en: "MIME Type",
				ko: "MIME 타입",
			},
			admin: {
				readOnly: true,
			},
		},
		{
			name: "name",
			type: "text",
			label: {
				en: "Name",
				ko: "파일 이름",
			},
			admin: {
				readOnly: true,
			},
		},
		{
			name: "webContentLink",
			type: "text",
			label: {
				en: "Web Content Link",
				ko: "웹 콘텐츠 링크",
			},
			admin: {
				readOnly: true,
			},
		},
		{
			name: "webViewLink",
			type: "text",
			label: {
				en: "Web View Link",
				ko: "웹 보기 링크",
			},
			admin: {
				readOnly: true,
			},
		},
		{
			name: "schemaFile",
			type: "json",
			label: {
				en: "Schema File",
				ko: "스키마 파일",
			},
			required: true,
			hidden: true,
		},
		{
			name: "permissions",
			type: "array",
			label: {
				en: "Permissions",
				ko: "권한",
			},
			fields: [
				{
					name: "permissionId",
					type: "text",
					label: {
						en: "Permission ID",
						ko: "권한 ID",
					},
					admin: {
						readOnly: true,
					},
				},
				{
					name: "type",
					type: "text",
					label: {
						en: "Type",
						ko: "유형",
					},
					admin: {
						readOnly: true,
					},
				},
				{
					name: "role",
					type: "text",
					label: {
						en: "Role",
						ko: "역할",
					},
					admin: {
						readOnly: true,
					},
				},
				{
					name: "emailAddress",
					type: "text",
					label: {
						en: "Email Address",
						ko: "이메일 주소",
					},
					admin: {
						readOnly: true,
					},
				},
			],
			hidden: true,
		},
	],
};
