import axios from "axios";

function resolveApiBaseURL() {
  const raw = import.meta.env.VITE_API_BASE_URL ?? "api";
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  const segment = raw.replace(/^\/+|\/+$/g, "");
  const siteBase = new URL(import.meta.env.BASE_URL, "http://vite.local");
  return new URL(segment, siteBase).pathname;
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseURL(),
  timeout: 15_000,
});
