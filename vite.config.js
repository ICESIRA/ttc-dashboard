import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base = "./" ทำให้ asset path เป็น relative → ใช้ได้ทั้ง root domain
// และ GitHub Pages แบบ /repo-name/ โดยไม่ต้องแก้
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "dist" },
});
