import type { Config } from "tailwindcss";

/*
 * Tailwind CSS v4 Configuration
 * - 대부분의 설정은 globals.css의 @theme inline에서 처리
 * - 이 파일은 content 경로와 Intellisense를 위해 사용
 */
export default {
	darkMode: "class",
	content: [
		"./src/**/*.{ts,tsx,js,jsx}",
		"../../packages/ui/src/**/*.{ts,tsx,js,jsx}",
	],
} satisfies Config;
