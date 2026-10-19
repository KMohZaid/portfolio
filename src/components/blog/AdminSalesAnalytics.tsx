import Link from "next/link";
import { AdminSalesRevenueChart } from "./AdminSalesRevenueChart";
import { getAdminSalesStats, type SalesPeriod } from "@/lib/blog/admin-analytics";

const periodLabels: Record<SalesPeriod, string> = { day: "Days", month: "Months", year: "Years" };

function rupees(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

export async function AdminSalesAnalytics({ period: requestedPeriod }: { period?: string }) {
  let stats;
  let error = "";
  try { stats = await getAdminSalesStats(requestedPeriod); }
  catch { error = "Sales analytics are temporarily unavailable."; }

  return <section aria-labelledby="sales-heading" className="mt-8 rounded-xl border border-border bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="sales-heading" className="font-mono text-lg font-semibold">Sales overview</h2><p className="mt-1 text-sm text-muted-foreground">Gross captured sales · INR · Asia/Kolkata</p></div>
      <nav aria-label="Revenue chart period" className="flex gap-1 rounded-lg border border-border p-1">
        {(Object.keys(periodLabels) as SalesPeriod[]).map((value) => <Link key={value} href={`/admin?period=${value}`} aria-current={(stats?.period ?? "month") === value ? "page" : undefined} className={`rounded-md px-3 py-1.5 text-sm ${(stats?.period ?? "month") === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{periodLabels[value]}</Link>)}
      </nav>
    </div>
    {error || !stats ? <p role="status" className="mt-5 rounded-lg bg-muted p-4 text-sm text-muted-foreground">{error || "Sales data unavailable."}</p> : <>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-lg border border-border bg-background p-4"><p className="text-sm text-muted-foreground">Lifetime gross captured</p><p className="mt-1 font-mono text-2xl font-semibold">{rupees(stats.summary.grossPaise)}</p></article>
        <article className="rounded-lg border border-border bg-background p-4"><p className="text-sm text-muted-foreground">Lifetime paid purchases</p><p className="mt-1 font-mono text-2xl font-semibold">{stats.summary.purchaseCount.toLocaleString("en-IN")}</p></article>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(16rem,1fr)]">
        <section className="min-w-0 rounded-lg border border-border p-4" aria-labelledby="revenue-heading">
          <h3 id="revenue-heading" className="font-mono font-medium">Gross revenue by {stats.period}</h3>
          {stats.revenue.every((point) => point.grossPaise === 0) ? <p className="mt-4 text-sm text-muted-foreground">No captured purchases in this period.</p> : <>
            <AdminSalesRevenueChart data={stats.revenue} period={stats.period} />
            <ol aria-label={`${stats.period} revenue data`} className="sr-only">
              {stats.revenue.map((point) => <li key={point.bucket}>{point.bucket}: {point.purchaseCount} purchases, {rupees(point.grossPaise)} gross revenue</li>)}
            </ol>
          </>}
        </section>
        <section className="rounded-lg border border-border p-4" aria-labelledby="best-sellers-heading">
          <h3 id="best-sellers-heading" className="font-mono font-medium">Best-selling articles</h3>
          {stats.bestSellers.length ? <ol className="mt-3 space-y-3">{stats.bestSellers.map((post, index) => <li key={post.slug} className="border-b border-border pb-3 last:border-0"><div className="flex items-start justify-between gap-2"><p className="min-w-0 break-words text-sm"><span className="mr-2 text-muted-foreground">{index + 1}.</span>{post.title}</p><span className="shrink-0 text-sm font-medium">{post.purchaseCount} sold</span></div><p className="ml-5 mt-1 text-xs text-muted-foreground">{rupees(post.grossPaise)} gross</p></li>)}</ol> : <p className="mt-4 text-sm text-muted-foreground">No paid purchases yet.</p>}
        </section>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Refund amounts and dates are not recorded; totals show gross captured amounts, not net earnings. {stats.summary.refundedPurchaseCount > 0 ? `${stats.summary.refundedPurchaseCount} purchases have a refund status recorded.` : "No refund statuses are recorded."}</p>
    </>}
  </section>;
}
