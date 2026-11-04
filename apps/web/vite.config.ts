import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { voidPlugin } from "void";

export default defineConfig({
	plugins: [
		// voidPlugin은 반드시 프레임워크 플러그인보다 앞에 둔다 (void 공식 가이드)
		voidPlugin(),
		tailwindcss(),
		tanstackStart(),
		react(),
	],
});
