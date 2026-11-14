import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      // React dans son propre fichier : cache stable et aucun fichier JS au-dessus de 250 Ko.
      output: { manualChunks: (id) => (/node_modules\/(react|react-dom|scheduler)\//.test(id) ? "react" : undefined) },
    },
  },
});
