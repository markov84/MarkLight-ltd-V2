/**
 * Example endpoints to create orders with either:
 *  - Card payment (Stripe) -> create PaymentIntent, confirm on client, finalize order
 *  - Cash on Delivery (COD) -> mark as cod_pending, create Econt/Speedy label
 */
import express from "express";
import Order from "../models/Order.js"; // after replacing with extended schema
import { auth } from "../utils/auth.js";
const router = express.Router();

router.post("/create", auth, async (req, res) => {
  const { items, totals, shipping, payment } = req.body;
  const order = await Order.create({
    user: req.user.id,
    items,
    totals,
    shipping,
    payment
  });
  res.json(order);
});

router.post("/:id/paid", auth, async (req, res) => {
  // called after Stripe confirms payment on the client
  const { id } = req.params;
  const { stripePaymentIntentId } = req.body;
  const order = await Order.findByIdAndUpdate(id, {
    $set: { "payment.status": "paid", "payment.stripePaymentIntentId": stripePaymentIntentId }
  }, { new: true });
  res.json(order);
});

export default router;
