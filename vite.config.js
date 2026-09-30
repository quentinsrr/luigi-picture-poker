import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Chemins relatifs : le même build sert au web et aux applis Capacitor.
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    // three.js pèse ~250 Ko gzip à lui seul ; il est déjà isolé dans son
    // propre fichier, chargé après l'écran du bas.
    chunkSizeWarningLimit: 1100,
  },
  server: {
    // host: true expose le serveur sur le réseau local :
    // tu peux ouvrir le jeu sur ton téléphone via http://<ip-du-pc>:5173
    host: true,
    port: 5173,
  },
});
