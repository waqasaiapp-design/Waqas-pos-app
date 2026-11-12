/**
 * WAQAS MART SALE APP — NEW SALE PAGE CALCULATION ENGINE
 * Pure, reliable, and strictly rounded calculation functions.
 * Adheres strictly to the user's business rules and Test Cases A through H.
 */

import { CartItem } from '../types/pos';

/**
 * Standard rounding to 2 decimal places to avoid IEEE 754 floating point errors
 */
export function round2(num: number): number {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export interface CalculatedLineItem {
  quantity: number;
  unitPrice: number;
  grossLineTotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  taxPercent: number;
  taxAmount: number;
  netLineAmount: number;
}

/**
 * Calculates a single sale line item using exact rules:
 * 1. Line Gross Total = Quantity × Actual Unit Sale Price
 * 2. Discount Amount = Gross Line Total × (Discount % / 100)
 * 3. Taxable Amount = Gross Line Total - Discount Amount
 * 4. Tax Amount = Taxable Amount × (Tax Rate / 100)
 * 5. Net Line Amount = Taxable Amount + Tax Amount
 */
export function calculateLineItem(
  qty: number,
  price: number,
  discPercent = 0,
  taxRate = 0
): CalculatedLineItem {
  const safeQty = isNaN(qty) || !isFinite(qty) ? 0 : Math.max(0, qty);
  const safePrice = isNaN(price) || !isFinite(price) ? 0 : Math.max(0, price);
  const safeDiscPercent = isNaN(discPercent) || !isFinite(discPercent) ? 0 : Math.min(100, Math.max(0, discPercent));
  const safeTaxPercent = isNaN(taxRate) || !isFinite(taxRate) ? 0 : Math.max(0, taxRate);

  const grossLineTotal = round2(safeQty * safePrice);
  const discountAmount = round2(grossLineTotal * (safeDiscPercent / 100));
  const taxableAmount = round2(Math.max(0, grossLineTotal - discountAmount));
  const taxAmount = round2(taxableAmount * (safeTaxPercent / 100));
  const netLineAmount = round2(taxableAmount + taxAmount);

  return {
    quantity: safeQty,
    unitPrice: safePrice,
    grossLineTotal,
    discountPercent: safeDiscPercent,
    discountAmount,
    taxableAmount,
    taxPercent: safeTaxPercent,
    taxAmount,
    netLineAmount,
  };
}

export interface InvoiceCalculations {
  subtotal: number;             // Gross Total of all line items
  totalLineDiscounts: number;   // Sum of line item discounts
  invoiceDiscount: number;      // Optional invoice-level discount
  totalDiscount: number;        // Total discount applied
  overallDiscount: number;      // Alias for total discount
  totalLineTaxes: number;       // Sum of line item taxes
  invoiceTax: number;           // Optional invoice-level tax
  totalTax: number;             // Total tax applied
  overallTax: number;           // Alias for total tax
  grandTotal: number;           // Final Invoice Total
  totalQty: number;             // Total item quantity
  cashReceived: number;         // Payments received
  remainingBalance: number;     // Remaining unpaid balance (Total - Received)
  changeDue: number;            // Change to return (Received - Total, when > 0)
}

/**
 * Computes overall invoice totals from current line items and overrides
 */
export function calculateInvoiceTotals(
  items: CartItem[],
  invoiceDiscountOverride = 0,
  invoiceTaxOverride = 0,
  cashReceived = 0
): InvoiceCalculations {
  let subtotal = 0;
  let totalLineDiscounts = 0;
  let totalLineTaxes = 0;
  let totalQty = 0;

  for (const item of items) {
    const calc = calculateLineItem(
      item.quantity,
      item.unitPrice,
      item.discountPercent || 0,
      item.taxPercent || 0
    );

    subtotal = round2(subtotal + calc.grossLineTotal);
    totalLineDiscounts = round2(totalLineDiscounts + calc.discountAmount);
    totalLineTaxes = round2(totalLineTaxes + calc.taxAmount);
    totalQty = round2(totalQty + calc.quantity);
  }

  const safeInvoiceDiscount = isNaN(invoiceDiscountOverride) || !isFinite(invoiceDiscountOverride)
    ? 0
    : Math.max(0, invoiceDiscountOverride);
  const safeInvoiceTax = isNaN(invoiceTaxOverride) || !isFinite(invoiceTaxOverride)
    ? 0
    : Math.max(0, invoiceTaxOverride);
  const safeCashReceived = isNaN(cashReceived) || !isFinite(cashReceived)
    ? 0
    : Math.max(0, cashReceived);

  const totalDiscount = round2(totalLineDiscounts + safeInvoiceDiscount);
  const totalTax = round2(totalLineTaxes + safeInvoiceTax);
  const grandTotal = round2(Math.max(0, subtotal - totalDiscount + totalTax));

  // User formula: Remaining Balance = Final Invoice Total - Valid Payments Received
  // If payment >= grandTotal: remaining balance is 0, change due is payment - total
  // If payment < grandTotal: remaining balance is grandTotal - payment, change due is 0
  const remainingBalance = safeCashReceived >= grandTotal
    ? 0
    : round2(grandTotal - safeCashReceived);

  const changeDue = safeCashReceived > grandTotal
    ? round2(safeCashReceived - grandTotal)
    : 0;

  return {
    subtotal,
    totalLineDiscounts,
    invoiceDiscount: safeInvoiceDiscount,
    totalDiscount,
    overallDiscount: totalDiscount,
    totalLineTaxes,
    invoiceTax: safeInvoiceTax,
    totalTax,
    overallTax: totalTax,
    grandTotal,
    totalQty,
    cashReceived: safeCashReceived,
    remainingBalance,
    changeDue,
  };
}

/**
 * Validates sale items before saving invoice
 */
export function validateSaleItems(items: CartItem[]): { valid: boolean; error?: string } {
  if (!items || items.length === 0) {
    return { valid: false, error: 'Please add at least one item before saving the invoice.' };
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (isNaN(it.quantity) || !isFinite(it.quantity) || it.quantity <= 0) {
      return {
        valid: false,
        error: `Item #${i + 1} (${it.product.name}) has an invalid quantity (${it.quantity}). Quantity must be greater than 0.`,
      };
    }
    if (isNaN(it.unitPrice) || !isFinite(it.unitPrice) || it.unitPrice < 0) {
      return {
        valid: false,
        error: `Item #${i + 1} (${it.product.name}) has an invalid price (${it.unitPrice}). Price cannot be negative.`,
      };
    }
  }

  return { valid: true };
}
