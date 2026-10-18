import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { query } from "./db";

export type PaywallSettings = {
  enabled: boolean;
  pricePaise: number;
  accessDurationSeconds: number | null;
  showExcerpt: boolean;
  showThumbnail: boolean;
};

export const defaultPaywall: PaywallSettings = {
  enabled: false,
  pricePaise: 0,
  accessDurationSeconds: null,
  showExcerpt: true,
  showThumbnail: true,
};

export async function getPaywall(postId: string): Promise<PaywallSettings> {
  const { rows } = await query<{
    enabled: boolean;
    price_paise: number;
    access_duration_seconds: number | null;
    show_excerpt: boolean;
    show_thumbnail: boolean;
  }>("SELECT enabled, price_paise, access_duration_seconds, show_excerpt, show_thumbnail FROM blog_post_paywalls WHERE post_id=$1", [postId]);
  const row = rows[0];
  return row ? {
    enabled: row.enabled,
    pricePaise: Number(row.price_paise),
    accessDurationSeconds: row.access_duration_seconds == null ? null : Number(row.access_duration_seconds),
    showExcerpt: row.show_excerpt,
    showThumbnail: row.show_thumbnail,
  } : defaultPaywall;
}

export async function savePaywall(postId: string, settings: PaywallSettings) {
  await query(`INSERT INTO blog_post_paywalls (post_id,enabled,price_paise,access_duration_seconds,show_excerpt,show_thumbnail,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,now())
    ON CONFLICT (post_id) DO UPDATE SET enabled=EXCLUDED.enabled, price_paise=EXCLUDED.price_paise,
      access_duration_seconds=EXCLUDED.access_duration_seconds, show_excerpt=EXCLUDED.show_excerpt,
      show_thumbnail=EXCLUDED.show_thumbnail, updated_at=now()`,
  [postId, settings.enabled, settings.pricePaise, settings.accessDurationSeconds, settings.showExcerpt, settings.showThumbnail]);
}

export async function userHasAccess(postId: string, userId: string | undefined) {
  if (!userId) return false;
  const { rows } = await query<{ allowed: boolean }>(`SELECT EXISTS (
    SELECT 1 FROM blog_purchases
    WHERE post_id=$1 AND user_id=$2 AND status='paid'
      AND (access_expires_at IS NULL OR access_expires_at > now())
  ) AS allowed`, [postId, userId]);
  return Boolean(rows[0]?.allowed);
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const { keySecret } = razorpayCredentials();
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest();
  const actual = Buffer.from(signature, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function razorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured.");
  if (!/^rzp_(test|live)_/.test(keyId)) throw new Error("Razorpay Key ID must be a Test Mode or Live Mode key.");
  return { keyId, keySecret };
}
