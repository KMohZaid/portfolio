"use client";

import { useState } from "react";
import { useRazorpay, type RazorpayOrderOptions } from "react-razorpay";
import { CreditCard, LoaderCircle } from "lucide-react";

type CheckoutProps = { postId: string; title: string; pricePaise: number };
type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

export function RazorpayCheckout({ postId, title, pricePaise }: CheckoutProps) {
  const { error: checkoutError, isLoading, Razorpay } = useRazorpay();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function purchase() {
    setBusy(true);
    setError("");
    try {
      const orderResponse = await fetch("/api/payments/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }) });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error ?? "Unable to start checkout.");
      if (!Razorpay) throw new Error(checkoutError ?? "Razorpay Checkout could not be loaded. Check your connection and try again.");
      const options: RazorpayOrderOptions = {
        key: order.keyId, amount: order.amount, currency: order.currency, name: order.name,
        description: order.description || title, order_id: order.orderId, theme: { color: "#a855f7" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (payment: RazorpayResult) => {
          try {
            const verification = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) });
            const result = await verification.json();
            if (!verification.ok) throw new Error(result.error ?? "Payment verification failed.");
            window.location.reload();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Payment verification failed.");
            setBusy(false);
          }
        },
      };
      const checkout = new Razorpay(options);
      checkout.on("payment.failed", (event) => { setError(event.error?.description ?? "Payment failed. You can try again."); setBusy(false); });
      checkout.open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start checkout.");
      setBusy(false);
    }
  }

  return <div><button type="button" disabled={busy || isLoading} onClick={() => void purchase()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"><CreditCard size={17} />{(busy || isLoading) && <LoaderCircle size={16} className="animate-spin" />}{busy ? "Opening secure checkout…" : `Unlock for ₹${(pricePaise / 100).toFixed(2)}`}</button>{(error || checkoutError) && <p role="alert" className="mt-2 text-sm text-destructive">{error || checkoutError}</p>}</div>;
}
