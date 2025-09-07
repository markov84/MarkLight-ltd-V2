import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import OfficePicker from "../components/OfficePicker";
import { Link, useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_URL || "";

export default function Checkout() {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("card"); // card | cod
  const [carrier, setCarrier] = useState("econt"); // econt | speedy
  const [toOfficeId, setToOfficeId] = useState("");
  const [city, setCity] = useState("");
  const [address1, setAddress1] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const subtotal = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const shipping = 0; // placeholder; call /api/shipping/*/calculate to get real price
  const codFee = paymentMethod === "cod" ? 0 : 0;
  const grandTotal = subtotal + shipping + codFee;

  const createOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cartItems.map(i => ({ product: i._id, quantity: i.quantity, price: i.price })),
          totals: { subtotal, shipping, codFee, grandTotal, currency: "BGN" },
          shipping: {
            carrier, method: toOfficeId ? "office" : "address",
            toOfficeId,
            address: { city, address1, phone }
          },
          payment: { method: paymentMethod, status: paymentMethod === "cod" ? "cod_pending" : "pending" }
        })
      });
      if (!res.ok) throw new Error("Order error");
      const order = await res.json();
      if (paymentMethod === "card") {
        // go to payment page with order id & total
        navigate(`/payment?order=${order._id}&amount=${Math.round(grandTotal*100)}`);
      } else {
        clearCart();
        navigate("/orders");
      }
    } catch (e) {
      setError("Грешка при създаване на поръчка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Поръчка</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Град</label>
        <input className="w-full border rounded px-3 py-2" value={city} onChange={e=>setCity(e.target.value)} placeholder="напр. София" />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Адрес (ако е до адрес)</label>
        <input className="w-full border rounded px-3 py-2" value={address1} onChange={e=>setAddress1(e.target.value)} placeholder="бул. ... №..." />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Телефон</label>
        <input className="w-full border rounded px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08..." />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Куриер</label>
        <select className="w-full border rounded px-3 py-2" value={carrier} onChange={e=>setCarrier(e.target.value)}>
          <option value="econt">Econt</option>
          <option value="speedy">Speedy</option>
        </select>
      </div>

      <OfficePicker carrier={carrier} city={city} value={toOfficeId} onChange={setToOfficeId} />

      <div className="space-y-2">
        <label className="block text-sm font-medium">Плащане</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="pay" value="card" checked={paymentMethod==="card"} onChange={()=>setPaymentMethod("card")} />
            Карта
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="pay" value="cod" checked={paymentMethod==="cod"} onChange={()=>setPaymentMethod("cod")} />
            Наложен платеж (в брой/ПОС)
          </label>
        </div>
      </div>

      <div className="p-3 bg-gray-50 rounded border">
        <div>Междинна сума: {subtotal.toFixed(2)} лв.</div>
        <div>Доставка: {shipping.toFixed(2)} лв.</div>
        {paymentMethod==="cod" && <div>Такса НП: {codFee.toFixed(2)} лв.</div>}
        <div className="font-semibold">Общо: {grandTotal.toFixed(2)} лв.</div>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <button onClick={createOrder} disabled={loading || !city || !phone || cartItems.length===0}
        className="px-5 py-2 rounded bg-black text-white disabled:opacity-50">
        {loading ? "Моля, изчакайте..." : "Потвърди поръчка"}
      </button>

      <div>
        <Link className="text-sm underline" to="/cart">Назад към количката</Link>
      </div>
    </div>
  );
}
