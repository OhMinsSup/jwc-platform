import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

import base from "./base";

/**
 * Tailwind CSS v4 Web Configuration
 * - v4에서는 animate 플러그인 대신 tw-animate-css 사용
 * - keyframes와 animations는 globals.css의 @theme inline에서 정의
 */
export default {
	content: base.content,
	presets: [base],
	theme: {
		container: {
			center: true,
		},
	},
	plugins: [typography],
} satisfies Config;
