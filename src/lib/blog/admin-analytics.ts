import "server-only";
import { query } from "./db";

export type SalesPeriod = "day" | "month" | "year";
const REPORTING_TIME_ZONE = "Asia/Kolkata";
const PERIODS: Record<SalesPeriod, { interval: string; count: number }> = {
  day: { interval: "1 day", count: 30 },
  month: { interval: "1 month", count: 12 },
  year: { interval: "1 year", count: 12 },
};

function isSalesPeriod(value: string | undefined): value is SalesPeriod {
  return value === "day" || value === "month" || value === "year";
}

export async function getAdminSalesStats(requestedPeriod?: string) {
  const period: SalesPeriod = isSalesPeriod(requestedPeriod) ? requestedPeriod : "month";
  const { interval, count } = PERIODS[period];
  const [{ rows: summaryRows }, { rows: revenueRows }, { rows: bestSellerRows }] = await Promise.all([
    query<{ purchase_count: string; gross_paise: string; refunded_count: string }>(`SELECT count(*)::text AS purchase_count,
        coalesce(sum(amount_paise),0)::text AS gross_paise,
        count(*) FILTER (WHERE refund_status <> 'none')::text AS refunded_count
      FROM blog_purchases WHERE status='paid' AND paid_at IS NOT NULL`),
    query<{ bucket: string; purchase_count: string; gross_paise: string }>(`WITH bounds AS (
        SELECT date_trunc($1, now() AT TIME ZONE $4) - ($2::int - 1) * $3::interval AS first_bucket,
               date_trunc($1, now() AT TIME ZONE $4) AS last_bucket
      ), buckets AS (
        SELECT generate_series(first_bucket, last_bucket, $3::interval) AS bucket FROM bounds
      ), sales AS (
        SELECT date_trunc($1, paid_at AT TIME ZONE $4) AS bucket,
               count(*)::text AS purchase_count, coalesce(sum(amount_paise),0)::text AS gross_paise
        FROM blog_purchases, bounds
        WHERE status='paid' AND paid_at >= first_bucket AT TIME ZONE $4
          AND paid_at < (last_bucket + $3::interval) AT TIME ZONE $4
        GROUP BY 1
      )
      SELECT to_char(buckets.bucket, 'YYYY-MM-DD HH24:MI:SS') AS bucket,
             coalesce(sales.purchase_count,'0') AS purchase_count,
             coalesce(sales.gross_paise,'0') AS gross_paise
      FROM buckets LEFT JOIN sales USING (bucket) ORDER BY buckets.bucket`, [period, count, interval, REPORTING_TIME_ZONE]),
    query<{ title: string; slug: string; purchase_count: string; gross_paise: string }>(`SELECT b.title,b.slug,count(*)::text AS purchase_count,coalesce(sum(p.amount_paise),0)::text AS gross_paise
      FROM blog_purchases p JOIN blog_posts b ON b.id=p.post_id
      WHERE p.status='paid' AND p.paid_at IS NOT NULL
      GROUP BY b.id,b.title,b.slug
      ORDER BY count(*) DESC,sum(p.amount_paise) DESC,b.title ASC LIMIT 5`),
  ]);

  return {
    period,
    timezone: REPORTING_TIME_ZONE,
    summary: {
      purchaseCount: Number(summaryRows[0]?.purchase_count ?? 0),
      grossPaise: Number(summaryRows[0]?.gross_paise ?? 0),
      refundedPurchaseCount: Number(summaryRows[0]?.refunded_count ?? 0),
    },
    revenue: revenueRows.map((row) => ({
      bucket: `${row.bucket}+05:30`,
      purchaseCount: Number(row.purchase_count),
      grossPaise: Number(row.gross_paise),
    })),
    bestSellers: bestSellerRows.map((row) => ({
      title: row.title,
      slug: row.slug,
      purchaseCount: Number(row.purchase_count),
      grossPaise: Number(row.gross_paise),
    })),
  };
}
