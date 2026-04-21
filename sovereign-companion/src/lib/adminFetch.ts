import { ADMIN_PW_KEY } from "./adminConfig";

function getAdminPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(ADMIN_PW_KEY) || "";
}

export function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("x-admin-password", getAdminPassword());
  return fetch(input, { ...init, headers });
}
