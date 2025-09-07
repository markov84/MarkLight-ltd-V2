export const RATES = {
  freeShippingThreshold: 150.0,
  carriers: {
    econt: { office: 6.49, address: 8.49 },
    speedy: { office: 5.99, address: 7.99 },
    other:  { office: 7.49, address: 9.49 }
  },
  cod: { percent: 1.2, minimum: 1.50 }
};

/**
 * Calculate a quote.
 * @param {Object} params
 * @param {'econt'|'speedy'|'other'} params.carrier
 * @param {boolean} params.toOffice
 * @param {number} params.subtotal
 * @param {boolean} params.cod
 * @returns {{shipping:number, codFee:number, grandTotal:number}}
 */
export function calculateQuote({ carrier = 'econt', toOffice = true, subtotal = 0, cod = false }) {
  const rates = RATES.carriers[carrier] || RATES.carriers.other;
  let shipping = toOffice ? rates.office : rates.address;

  if (subtotal >= RATES.freeShippingThreshold) {
    shipping = 0;
  }

  let codFee = 0;
  if (cod) {
    codFee = Math.max(RATES.cod.minimum, (subtotal + shipping) * (RATES.cod.percent / 100));
  }

  const grandTotal = subtotal + shipping + codFee;
  return { shipping: round2(shipping), codFee: round2(codFee), grandTotal: round2(grandTotal) };
}

function round2(n){ return Math.round(n * 100) / 100; }