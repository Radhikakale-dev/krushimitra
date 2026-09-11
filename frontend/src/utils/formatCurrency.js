/**
 * utils/formatCurrency.js
 * Format numbers as Indian currency (₹) with lakh/crore support.
 */

/**
 * Format a number as Indian Rupee currency
 * @param {number} amount
 * @param {boolean} compact - Use compact notation (₹1.2L, ₹2.5Cr)
 */
export const formatCurrency = (amount = 0, compact = false) => {
  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000)     return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Parse a currency string back to a number
 */
export const parseCurrency = (str = '') => {
  return parseFloat(str.replace(/[₹,\s]/g, '')) || 0;
};

export default formatCurrency;
