import { defineConfig } from "vite";

const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const isUserOrOrgSite = Boolean(repo?.endsWith(".github.io"));
const base =
  isGitHubActions && repo && !isUserOrOrgSite ? `/${repo}/` : "/";

const jsonServerTarget = "http://127.0.0.1:3001";

function stripApiPrefix(prefix) {
  return (path) =>
    path.startsWith(prefix) ? path.slice(prefix.length) || "/" : path;
}

const previewProxy = {
  "/api": {
    target: jsonServerTarget,
    changeOrigin: true,
    rewrite: stripApiPrefix("/api"),
  },
};

if (base !== "/") {
  const prefixedApi = `${base.replace(/\/$/, "")}/api`;
  previewProxy[prefixedApi] = {
    target: jsonServerTarget,
    changeOrigin: true,
    rewrite: stripApiPrefix(prefixedApi),
  };
}

export default defineConfig({
  base,
  server: {
    port: 4000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
    proxy: previewProxy,
  },
});
