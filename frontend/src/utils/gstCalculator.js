/**
 * utils/gstCalculator.js
 * GST calculation utilities for billing.
 */

const GST_RATES = [0, 5, 12, 18, 28];

/**
 * Calculate GST for a given amount and rate
 * @param {number} baseAmount - Price before GST
 * @param {number} gstRate    - GST % (0, 5, 12, 18, 28)
 * @param {boolean} inclusive - If true, baseAmount already includes GST
 */
export const calculateGST = (baseAmount, gstRate = 18, inclusive = false) => {
  if (!gstRate) return { cgst: 0, sgst: 0, igst: 0, totalGst: 0, baseAmount, totalAmount: baseAmount };

  let base, totalGst;

  if (inclusive) {
    // Extract GST from inclusive price
    base = (baseAmount * 100) / (100 + gstRate);
    totalGst = baseAmount - base;
  } else {
    base = baseAmount;
    totalGst = (baseAmount * gstRate) / 100;
  }

  const halfGst = totalGst / 2;

  return {
    baseAmount: parseFloat(base.toFixed(2)),
    cgst:       parseFloat(halfGst.toFixed(2)),  // Central GST
    sgst:       parseFloat(halfGst.toFixed(2)),  // State GST
    igst:       parseFloat(totalGst.toFixed(2)), // Inter-state GST (full)
    totalGst:   parseFloat(totalGst.toFixed(2)),
    totalAmount: parseFloat((base + totalGst).toFixed(2)),
    gstRate,
  };
};

/**
 * Calculate discounted price
 */
export const applyDiscount = (price, discountPercent = 0, discountAmount = 0) => {
  let discounted = price;
  if (discountPercent) discounted -= (price * discountPercent) / 100;
  if (discountAmount) discounted -= discountAmount;
  return Math.max(0, parseFloat(discounted.toFixed(2)));
};

export { GST_RATES };
export default calculateGST;
