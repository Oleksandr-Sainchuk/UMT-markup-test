import { defineConfig } from "vite";

const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const isUserOrOrgSite = Boolean(repo?.endsWith(".github.io"));
const base =
  isGitHubActions && repo && !isUserOrOrgSite ? `/${repo}/` : "/";

export default defineConfig({
  base,
  server: {
    port: 3000,
  },
});
