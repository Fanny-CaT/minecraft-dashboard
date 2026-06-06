import { auth } from "@/lib/firebase";

/**
 * Secure, encapsulated fetch wrapper. 
 * Replaces the dangerous window.fetch monkey-patch.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const config = {
    ...options,
    headers,
  };

  return fetch(url, config);
}
