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

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const token = await authToken();
  const res = await fetch(`${SITE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    throw new Error((json?.error as string) || `Request failed (${res.status})`);
  }
  return json as T;
}
