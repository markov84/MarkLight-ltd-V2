import React, { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
const API = import.meta.env.VITE_API_URL || "";

function CheckoutForm({ clientSecret, orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: "if_required"
    });
    if (error) {
      setError(error.message || "Плащането е отказано.");
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      await fetch(`${API}/api/orders/${orderId}/paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ stripePaymentIntentId: paymentIntent.id })
      });
      window.location.href = "/orders";
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
      <PaymentElement />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button disabled={!stripe || loading} className="px-5 py-2 rounded bg-black text-white disabled:opacity-50">
        {loading ? "Обработване..." : "Плати"}
      </button>
    </form>
  );
}

export default function PaymentPage() {
  const url = new URL(window.location.href);
  const clientSecret = url.searchParams.get("cs");
  const orderId = url.searchParams.get("order");
  const amount = parseInt(url.searchParams.get("amount") || "0", 10);

  const stripePromise = useMemo(() => loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY), []);
  const options = useMemo(() => ({ clientSecret, appearance: { labels: "floating" } }), [clientSecret]);

  const [creating, setCreating] = useState(!clientSecret);
  const [secret, setSecret] = useState(clientSecret || "");

  React.useEffect(() => {
    const create = async () => {
      if (clientSecret) return;
      setCreating(true);
      const res = await fetch(`${API}/api/payments/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, currency: "bgn", metadata: { orderId } })
      });
      const data = await res.json();
      setSecret(data.clientSecret);
      setCreating(false);
    };
    create();
  }, [amount, orderId, clientSecret]);

  if (creating || !secret) return <div className="p-6 text-center">Подготовка на плащането...</div>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret: secret }}>
      <CheckoutForm clientSecret={secret} orderId={orderId} />
    </Elements>
  );
}
