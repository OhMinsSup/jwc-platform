import { ExcelManager } from "@jwc/excel";
import { authenticated } from "@jwc/payload/access/authenticated";
import { getGoogleSpreadsheet } from "@jwc/payload/helpers/google";
import { decryptFieldValue } from "@jwc/payload/hooks/decryptFieldValue";
import { encryptFieldValue } from "@jwc/payload/hooks/encryptFieldValue";
import { formatFormUserFullName } from "@jwc/payload/hooks/formatFormUserFullName";
import { syncGoogleSheet } from "@jwc/payload/hooks/syncGoogleSheet";
import type { CollectionConfig } from "payload";

export const Forms: CollectionConfig = {
	slug: "forms",
	access: {
		create: authenticated,
		delete: authenticated,
		update: authenticated,
		read: authenticated,
	},
	labels: {
		singular: {
			en: "Form",
			ko: "수련회 신청서",
		},
		plural: {
			en: "Forms",
			ko: "수련회 신청서 목록",
		},
	},
	admin: {
		useAsTitle: "name",
		components: {
			beforeListTable: [
				{
					path: "@jwc/payload/components/BeforeListTable#BeforeListTable",
				},
			],
		},
	},
	endpoints: [
		{
			path: "/excel/export",
			method: "get",
			handler: async (req) => {
				const $excel = new ExcelManager();

				try {
					const workbook = $excel.createWorkbook();

					const sheet = $excel.createSheet(
						workbook,
						"청년부 연합 여름 수련회 참가자 명단"
					);

					const headers = $excel.head.createFormSheetHeaders();

					const { docs } = await req.payload.find({
						collection: "forms",
						limit: 100,
						req,
					});

					const rows = $excel.rowData.generateExcelFormRows(docs);

					$excel.generateExcel({
						workbook,
						sheet,
						headers,
						rows,
					});

					const buffer = await workbook.xlsx.writeBuffer();

					const arrayBufferLike = new Uint8Array(buffer);

					return new Response(arrayBufferLike, {
						headers: {
							"Content-Type":
								"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
							"Content-Disposition": 'attachment; filename="forms.xlsx"',
						},
					});
				} catch (error) {
					console.error(error);
					return new Response("Internal Server Error", {
						status: 500,
					});
				} finally {
					$excel.destroyWorkbook();
				}
			},
		},
		{
			path: "/google-sheet/export",
			method: "get",
			handler: async (req) => {
				const sheet = await getGoogleSpreadsheet();

				const buffer = await sheet.downloadAsCSV();

				return new Response(buffer, {
					headers: {
						"Content-Type": "text/csv; charset=utf-8",
						"Content-Disposition": 'attachment; filename="forms.csv"',
					},
				});
			},
		},
	],
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
			},
			hooks: {
				afterRead: [formatFormUserFullName],
			},
			required: true,
			maxLength: 100,
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
			name: "gender",
			label: {
				ko: "성별",
				en: "gender",
			},
			type: "radio",
			options: [
				{
					label: {
						ko: "남성",
						en: "male",
					},
					value: "남성",
				},
				{
					label: {
						ko: "여성",
						en: "female",
					},
					value: "여성",
				},
			],
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
			name: "pickupTimeDesc",
			label: {
				ko: "픽업 가능 시간",
				en: "Pickup available time",
			},
			type: "text",
			admin: {
				placeholder: {
					ko: "부분참일 경우 참석 가능한 시간 혹은 픽업을 원하는 시간을 적어주세요.",
					en: "If you are a partial participant, please write down the time you can attend or the time you want to be picked up.",
				},
			},
			maxLength: 500,
		},
		{
			name: "isPaid",
			label: {
				ko: "회비 납입 여부",
				en: "Payment of membership fee status",
			},
			type: "checkbox",
			required: true,
			defaultValue: false,
		},
		{
			name: "numberOfStays",
			label: {
				ko: "참석 형태",
				en: "Number of stays",
			},
			type: "select",
			required: true,
			options: [
				{
					value: "3박4일",
					label: {
						ko: "3박4일",
						en: "3 nights 4 days",
					},
				},
				{
					value: "2박3일",
					label: {
						ko: "2박3일",
						en: "2 nights 3 days",
					},
				},
				{
					value: "1박2일",
					label: {
						ko: "1박2일",
						en: "1 night 2 days",
					},
				},
				{
					value: "무박",
					label: {
						ko: "무박",
						en: "No nights",
					},
				},
			],
		},
		{
			name: "tfTeam",
			label: {
				ko: "TF팀 지원",
				en: "TF Team",
			},
			type: "select",
			options: [
				{
					value: "없음",
					label: {
						ko: "없음",
						en: "None",
					},
				},
				{
					value: "찬양팀",
					label: {
						ko: "찬양팀",
						en: "Praise Team",
					},
				},
				{
					value: "프로그램팀",
					label: {
						ko: "프로그램팀",
						en: "Program Team",
					},
				},
				{
					value: "미디어팀",
					label: {
						ko: "미디어팀",
						en: "Media Team",
					},
				},
			],
		},
		{
			name: "carSupport",
			label: {
				ko: "차량 지원",
				en: "Car Support",
			},
			type: "checkbox",
			defaultValue: false,
		},
		{
			name: "carSupportContent",
			label: {
				ko: "차량 지원 내용",
				en: "Car Support Content",
			},
			type: "text",
		},
		{
			name: "memo",
			label: {
				ko: "메모",
				en: "Memo",
			},
			type: "richText",
		},
		{
			name: "tshirtSize",
			type: "select",
			required: false,
			label: {
				ko: "단체티 사이즈",
				en: "Group T-shirt Size",
			},
			options: [
				{
					value: "s",
					label: {
						ko: "S 사이즈",
						en: "S Size",
					},
				},
				{
					value: "m",
					label: {
						ko: "M 사이즈",
						en: "M Size",
					},
				},
				{
					value: "l",
					label: {
						ko: "L 사이즈",
						en: "L Size",
					},
				},
				{
					value: "xl",
					label: {
						ko: "XL 사이즈",
						en: "XL Size",
					},
				},
				{
					value: "2xl",
					label: {
						ko: "2XL 사이즈",
						en: "2XL Size",
					},
				},
				{
					value: "3xl",
					label: {
						ko: "3XL 사이즈",
						en: "3XL Size",
					},
				},
			],
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
	],
	hooks: {
		afterChange: [syncGoogleSheet],
	},
};
