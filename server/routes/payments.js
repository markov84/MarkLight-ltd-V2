import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a PaymentIntent.
 * Expects: { amount, currency, metadata, customerEmail }
 * Returns: { clientSecret }
 */
router.post("/create-intent", async (req, res) => {
  try {
    const { amount, currency = "bgn", metadata = {}, customerEmail } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // amount in stotinki
      currency,
      receipt_email: customerEmail,
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ message: "Stripe error", error: err.message });
  }
});

export default router;
