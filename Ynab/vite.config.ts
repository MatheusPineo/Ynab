import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Sincroniza dinamicamente a versão do package.json com o CHANGELOG.md
try {
  const changelogPath = path.resolve(__dirname, "../CHANGELOG.md");
  const packageJsonPath = path.resolve(__dirname, "./package.json");

  if (fs.existsSync(changelogPath) && fs.existsSync(packageJsonPath)) {
    const changelogContent = fs.readFileSync(changelogPath, "utf-8");
    // Regex para pegar a versão mais recente declarada no cabeçalho: ## [X.Y.Z]
    const match = changelogContent.match(/##\s*\[([0-9]+\.[0-9]+\.[0-9]+)\]/);
    if (match && match[1]) {
      const latestVersion = match[1];
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      
      if (packageJson.version !== latestVersion) {
        packageJson.version = latestVersion;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf-8");
        console.log(`\x1b[32m[Version Sync] Sincronizada versão do frontend para v${latestVersion} com base no CHANGELOG.md\x1b[0m`);
      }
    }
  }
} catch (err) {
  console.error("[Version Sync Error] Falha ao sincronizar versão do CHANGELOG com o package.json:", err);
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  esbuild: {
    keepNames: true, // Preserva nomes de classes e funções para depuração rica e de-minificação no PostHog
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    sourcemap: true,
  },
}));
