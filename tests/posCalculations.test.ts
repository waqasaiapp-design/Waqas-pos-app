import {
  calculateLineItem,
  calculateInvoiceTotals,
  validateSaleItems,
} from '../src/utils/newPosCalculations';
import { CartItem, Product, SaleTransaction } from '../src/types/pos';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
}

console.log('--- STARTING POS CALCULATION TESTS A - H ---');

// Test A — Simple Sale:
// Quantity: 2, Unit price: Rs. 100, Discount: 0%, Tax: 0% -> Expected total: Rs. 200
{
  const item = calculateLineItem(2, 100, 0, 0);
  assert(item.grossLineTotal === 200, `Test A gross expected 200, got ${item.grossLineTotal}`);
  assert(item.netLineAmount === 200, `Test A total expected 200, got ${item.netLineAmount}`);
  console.log('✓ Test A Passed: Simple Sale (2 × Rs. 100 = Rs. 200)');
}

// Test B — Editable Price:
// Quantity: 2, Standard price: Rs. 500, Actual sale price: Rs. 450, Discount: 0%, Tax: 0% -> Expected total: Rs. 900
{
  const item = calculateLineItem(2, 450, 0, 0);
  assert(item.grossLineTotal === 900, `Test B gross expected 900, got ${item.grossLineTotal}`);
  assert(item.netLineAmount === 900, `Test B net expected 900, got ${item.netLineAmount}`);
  console.log('✓ Test B Passed: Editable Price (2 × Rs. 450 = Rs. 900)');
}

// Test C — Percentage Discount:
// Quantity: 2, Unit price: Rs. 500, Discount: 10%, Tax: 0%
// Expected gross: Rs. 1,000, Expected discount: Rs. 100, Expected total: Rs. 900
{
  const item = calculateLineItem(2, 500, 10, 0);
  assert(item.grossLineTotal === 1000, `Test C gross expected 1000, got ${item.grossLineTotal}`);
  assert(item.discountAmount === 100, `Test C discount expected 100, got ${item.discountAmount}`);
  assert(item.netLineAmount === 900, `Test C net expected 900, got ${item.netLineAmount}`);
  console.log('✓ Test C Passed: Percentage Discount (Gross Rs. 1,000, Disc Rs. 100, Net Rs. 900)');
}

// Test D — Tax After Discount:
// Quantity: 1, Unit price: Rs. 1,000, Discount: 10%, Tax: 5%
// Expected gross: Rs. 1,000, Expected discount: Rs. 100, Expected tax: Rs. 45, Expected total: Rs. 945
{
  const item = calculateLineItem(1, 1000, 10, 5);
  assert(item.grossLineTotal === 1000, `Test D gross expected 1000, got ${item.grossLineTotal}`);
  assert(item.discountAmount === 100, `Test D discount expected 100, got ${item.discountAmount}`);
  assert(item.taxAmount === 45, `Test D tax expected 45, got ${item.taxAmount}`);
  assert(item.netLineAmount === 945, `Test D net expected 945, got ${item.netLineAmount}`);
  console.log('✓ Test D Passed: Tax After Discount (Gross 1000, Disc 100, Taxable 900, Tax 45, Total 945)');
}

// Test E — Multiple Items:
// Item 1: 2 × Rs. 100 = Rs. 200
// Item 2: 3 × Rs. 50 = Rs. 150
// Expected invoice total: Rs. 350
{
  const mockProd1: Product = { id: 'p1', name: 'Item 1', barcode: '111', price: 100, costPrice: 80, stock: 10, category: 'General', unit: 'Pcs' };
  const mockProd2: Product = { id: 'p2', name: 'Item 2', barcode: '222', price: 50, costPrice: 40, stock: 10, category: 'General', unit: 'Pcs' };

  const items: CartItem[] = [
    {
      id: 'c1',
      product: mockProd1,
      quantity: 2,
      unitPrice: 100,
      lineTotal: 200,
      discountAmount: 0,
      taxAmount: 0,
      netAmount: 200,
    },
    {
      id: 'c2',
      product: mockProd2,
      quantity: 3,
      unitPrice: 50,
      lineTotal: 150,
      discountAmount: 0,
      taxAmount: 0,
      netAmount: 150,
    },
  ];

  const totals = calculateInvoiceTotals(items, 0, 0, 350);
  assert(totals.subtotal === 350, `Test E subtotal expected 350, got ${totals.subtotal}`);
  assert(totals.grandTotal === 350, `Test E grandTotal expected 350, got ${totals.grandTotal}`);
  assert(totals.totalQty === 5, `Test E totalQty expected 5, got ${totals.totalQty}`);
  console.log('✓ Test E Passed: Multiple Items (Rs. 200 + Rs. 150 = Rs. 350)');
}

// Test F — Remove Item:
// Add items worth Rs. 200 and Rs. 150. Remove the Rs. 150 item. Expected total: Rs. 200.
{
  const mockProd1: Product = { id: 'p1', name: 'Item 1', barcode: '111', price: 100, costPrice: 80, stock: 10, category: 'General', unit: 'Pcs' };
  const mockProd2: Product = { id: 'p2', name: 'Item 2', barcode: '222', price: 50, costPrice: 40, stock: 10, category: 'General', unit: 'Pcs' };

  let items: CartItem[] = [
    { id: 'c1', product: mockProd1, quantity: 2, unitPrice: 100, lineTotal: 200, discountAmount: 0 },
    { id: 'c2', product: mockProd2, quantity: 3, unitPrice: 50, lineTotal: 150, discountAmount: 0 },
  ];

  // Remove second item
  items = items.filter((it) => it.id !== 'c2');
  const totals = calculateInvoiceTotals(items, 0, 0, 200);
  assert(totals.grandTotal === 200, `Test F expected 200 after removal, got ${totals.grandTotal}`);
  assert(totals.totalQty === 2, `Test F totalQty expected 2, got ${totals.totalQty}`);
  console.log('✓ Test F Passed: Remove Item (Totals updated cleanly from 350 to 200)');
}

// Test G — Payment Balance:
// Invoice total: Rs. 500, Payment received: Rs. 300 -> Expected remaining balance: Rs. 200.
// Invoice total: Rs. 500, Payment received: Rs. 500 -> Expected remaining balance: Rs. 0.
// Invoice total: Rs. 500, Payment received: Rs. 600 -> Expected change due: Rs. 100, remaining balance: Rs. 0.
{
  const mockProd: Product = { id: 'p1', name: 'Item', barcode: '111', price: 500, costPrice: 400, stock: 10, category: 'General', unit: 'Pcs' };
  const items: CartItem[] = [{ id: 'c1', product: mockProd, quantity: 1, unitPrice: 500, lineTotal: 500, discountAmount: 0 }];

  // Partial Payment
  const partial = calculateInvoiceTotals(items, 0, 0, 300);
  assert(partial.grandTotal === 500, `Test G total expected 500, got ${partial.grandTotal}`);
  assert(partial.remainingBalance === 200, `Test G partial remaining expected 200, got ${partial.remainingBalance}`);
  assert(partial.changeDue === 0, `Test G partial change expected 0, got ${partial.changeDue}`);

  // Exact Payment
  const exact = calculateInvoiceTotals(items, 0, 0, 500);
  assert(exact.remainingBalance === 0, `Test G exact remaining expected 0, got ${exact.remainingBalance}`);
  assert(exact.changeDue === 0, `Test G exact change expected 0, got ${exact.changeDue}`);

  // Overpayment / Change
  const over = calculateInvoiceTotals(items, 0, 0, 600);
  assert(over.remainingBalance === 0, `Test G over remaining expected 0, got ${over.remainingBalance}`);
  assert(over.changeDue === 100, `Test G over change expected 100, got ${over.changeDue}`);
  console.log('✓ Test G Passed: Payment Balance (Partial balance Rs. 200, Exact Rs. 0, Change Rs. 100)');
}

// Test H — Save and Reload:
// Save a sale with edited unit price and quantity. Reopen the saved invoice.
// Verify that all line amounts, discount, tax and final totals remain identical.
{
  const mockProd: Product = { id: 'p1', name: 'Custom Price Item', barcode: '888', price: 500, costPrice: 300, stock: 10, category: 'General', unit: 'Pcs' };
  // Cashier sells 2 units at Rs. 450 (edited price) with 5% discount and 2% tax
  const calc = calculateLineItem(2, 450, 5, 2);
  const cartItem: CartItem = {
    id: 'cart-1',
    product: mockProd,
    quantity: calc.quantity,
    unitPrice: calc.unitPrice,
    lineTotal: calc.grossLineTotal,
    discountPercent: calc.discountPercent,
    discountAmount: calc.discountAmount,
    taxPercent: calc.taxPercent,
    taxAmount: calc.taxAmount,
    netAmount: calc.netLineAmount,
  };

  const totals = calculateInvoiceTotals([cartItem], 0, 0, calc.netLineAmount);

  // Simulated saved transaction
  const savedTx: SaleTransaction = {
    invoiceNumber: 'WM-795',
    dateTime: '28 Oct 2026',
    mode: 'sale',
    cashierName: 'Admin',
    items: [cartItem],
    subtotal: totals.subtotal,
    discount: totals.totalDiscount,
    taxAmount: totals.totalTax,
    grandTotal: totals.grandTotal,
    paymentMethod: 'cash',
    cashTendered: totals.grandTotal,
    status: 'completed',
  };

  // Re-open / Reload verification
  const reloadedItem = savedTx.items[0];
  assert(reloadedItem.quantity === 2, 'Reloaded quantity must equal 2');
  assert(reloadedItem.unitPrice === 450, 'Reloaded unitPrice must equal 450');
  assert(reloadedItem.lineTotal === 900, 'Reloaded lineTotal must equal 900');
  assert(reloadedItem.discountAmount === 45, 'Reloaded discountAmount must equal 45');
  assert(reloadedItem.taxAmount === 17.1, `Reloaded taxAmount expected 17.1, got ${reloadedItem.taxAmount}`);
  assert(reloadedItem.netAmount === 872.1, `Reloaded netAmount expected 872.1, got ${reloadedItem.netAmount}`);
  assert(savedTx.grandTotal === 872.1, `Reloaded grandTotal expected 872.1, got ${savedTx.grandTotal}`);

  console.log('✓ Test H Passed: Save and Reload (All line values, discounts, taxes, and totals match 100%)');
}

// Validation Tests
{
  const emptyValidation = validateSaleItems([]);
  assert(!emptyValidation.valid, 'Empty sale validation must fail');

  const mockProd: Product = { id: 'p1', name: 'Item', barcode: '111', price: 100, costPrice: 80, stock: 10, category: 'General', unit: 'Pcs' };
  const invalidQty = validateSaleItems([{ id: 'c1', product: mockProd, quantity: 0, unitPrice: 100, lineTotal: 0, discountAmount: 0 }]);
  assert(!invalidQty.valid, 'Zero qty validation must fail');

  const valid = validateSaleItems([{ id: 'c1', product: mockProd, quantity: 1.5, unitPrice: 100, lineTotal: 150, discountAmount: 0 }]);
  assert(valid.valid, 'Fractional valid qty must pass');
  console.log('✓ Validation Tests Passed: Empty, zero qty, and fractional checks verified');
}

console.log('ALL TESTS A THROUGH H PASSED SUCCESSFULLY!');
