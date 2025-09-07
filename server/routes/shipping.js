import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { calculateQuote } from "../utils/shippingRates.js";
dotenv.config();

const router = express.Router();

/**
 * Unified offices endpoint
 * GET /api/shipping/offices?carrier=econt&city=София
 * Returns: [{ id, name }]
 * Falls back to sample data if missing API keys.
 */
router.get("/offices", async (req, res) => {
  const carrier = (req.query.carrier || "econt").toLowerCase();
  const city = req.query.city || "";
  try {
    // Real integrations (require API keys & endpoints):
    if (carrier === "econt" && process.env.ECONT_BASE_URL) {
      // Example request - consult Econt API docs for exact payloads
      const url = `${process.env.ECONT_BASE_URL}/Nomenclatures/NomenclaturesService.getOffices.json`;
      const { data } = await axios.post(url, { cityName: city });
      const offices = (data?.offices || []).map(o => ({ id: o.id || o.code, name: o.name || o.address?.label }));
      return res.json(offices);
    }
    if (carrier === "speedy" && process.env.SPEEDY_BASE_URL && process.env.SPEEDY_USER && process.env.SPEEDY_PASS) {
      // Speedy usually needs session auth; for demo we'll return fallback unless configured
      // ...Implement real auth/calls here if keys exist...
    }

    // Fallback sample
    const sample = [
      { id: `${carrier}-office-001`, name: `${carrier.toUpperCase()} Офис Център (${city || 'София'})` },
      { id: `${carrier}-office-002`, name: `${carrier.toUpperCase()} Офис Младост (${city || 'София'})` },
      { id: `${carrier}-locker-003`, name: `${carrier.toUpperCase()} Автомат Mall (${city || 'София'})` }
    ];
    res.json(sample);
  } catch (e) {
    console.error("offices error", e.response?.data || e.message);
    res.status(500).json({ message: "Offices error", error: e.message });
  }
});

/**
 * Calculate shipping quote
 * POST /api/shipping/quote
 * Body: { carrier, toOffice, subtotal, cod }
 */
router.post("/quote", async (req, res) => {
  try {
    const { carrier = "econt", toOffice = true, subtotal = 0, cod = false } = req.body || {};
    const result = calculateQuote({ carrier, toOffice, subtotal, cod });
    res.json(result);
  } catch (e) {
    console.error("quote error", e.message);
    res.status(500).json({ message: "Quote error", error: e.message });
  }
});

/**
 * Create shipment (stub)
 * POST /api/shipping/create
 * Body: { carrier, toOffice, toOfficeId, address1, city, phone, orderId, cod, amount }
 */
router.post("/create", async (req, res) => {
  try {
    const { carrier = "econt", orderId, cod = false, amount = 0 } = req.body || {};
    // In real integration: call carrier API to create shipment/waybill.
    // Here we return a stub tracking number to keep DB safe.
    const tracking = `${carrier.toUpperCase()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    res.json({ tracking, labelUrl: null, cod, amount });
  } catch (e) {
    console.error("create shipment error", e.message);
    res.status(500).json({ message: "Create shipment error", error: e.message });
  }
});

export default router;