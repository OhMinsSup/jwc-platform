import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { voidPlugin } from "void";

export default defineConfig(({ mode }) => ({
	// production 미리보기의 Cloudflare 바인딩은 쉘 환경과 다르다. 공개 더미 .dev.vars만 읽는다.
	envDir: mode === "performance" ? "../../config/env/performance" : undefined,
	plugins: [
		// voidPlugin은 반드시 프레임워크 플러그인보다 앞에 둔다 (void 공식 가이드)
		voidPlugin({
			persistTo: ["e2e", "performance"].includes(mode)
				? `.void/${mode}`
				: undefined,
		}),
		tailwindcss(),
		tanstackStart(),
		react(),
	],
}));
