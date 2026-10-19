"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesPeriod } from "@/lib/blog/admin-analytics";

type RevenuePoint = { bucket: string; purchaseCount: number; grossPaise: number };

function rupees(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

function bucketLabel(bucket: string, period: SalesPeriod) {
  const date = new Date(bucket);
  if (period === "year") return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric" }).format(date);
  if (period === "month") return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "short", year: "2-digit" }).format(date);
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "short", day: "numeric" }).format(date);
}

export function AdminSalesRevenueChart({ data, period }: { data: RevenuePoint[]; period: SalesPeriod }) {
  const chartData = data.map((point) => ({ ...point, label: bucketLabel(point.bucket, period) }));

  return <div className="mt-4 h-64 min-w-0" role="img" aria-label={`Gross captured revenue by ${period}. Hover or focus a point to inspect its revenue and purchase count.`}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 5" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis domain={[0, "auto"]} tickFormatter={(value: number) => rupees(value)} width={72} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          labelFormatter={(label) => label}
          formatter={(value, _name, item) => [rupees(Number(value)), `Gross · ${item.payload.purchaseCount} purchase${item.payload.purchaseCount === 1 ? "" : "s"}`]}
          contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "0.75rem", color: "hsl(var(--foreground))" }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Line type="monotone" dataKey="grossPaise" name="Gross revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} animationDuration={650} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
