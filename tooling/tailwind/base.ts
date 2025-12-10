import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 Base Configuration
 * - v4에서는 대부분의 설정이 CSS로 이동
 * - 이 파일은 content 경로와 공통 설정만 포함
 */
export default {
	darkMode: "class",
	content: ["src/**/*.{ts,tsx,js,jsx}"],
} satisfies Config;
