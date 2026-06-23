// ============================================================
// SparkHour mobile — server API helper.
// The mobile app reuses the WEB's server-authoritative endpoints (same backend)
// so pricing, VAT, commission base, availability validation, sequential invoice
// numbers, and the Stripe PaymentIntent are all derived server-side — never on
// the device. Calls are authenticated with the Supabase session access token.
// ============================================================

import { supabase } from './supabase';

export const SITE_URL = 'https://www.sparkhour.ae';

async function authToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await authToken();
  const res = await fetch(`${SITE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    throw new Error((json?.error as string) || `Request failed (${res.status})`);
  }
  return json as T;
}

export const apiGet = <T = unknown>(path: string) => request<T>('GET', path);
export const apiPost = <T = unknown>(path: string, body: unknown) => request<T>('POST', path, body);
export const apiPatch = <T = unknown>(path: string, body: unknown) => request<T>('PATCH', path, body);
