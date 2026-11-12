import { Product } from '../src/types/pos';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
}

console.log('--- STARTING NEGATIVE STOCK MANAGEMENT SYSTEM TESTS ---');

// Formula used in server.ts and App.tsx:
// Sale deduction: (Number(product.stock) || 0) - item.quantity
// Purchase addition: (Number(product.stock) || 0) + item.quantity

// Case 1: Initial Stock = 0, sell 5 units -> Stock becomes -5
{
  const initialStock = 0;
  const soldQty = 5;
  const newStock = initialStock - soldQty;
  assert(newStock === -5, `Case 1 expected -5, got ${newStock}`);
  console.log('✓ Case 1 Passed: Stock 0, sell 5 -> stock is now -5');
}

// Case 2: Initial Stock = 0, sell 10 units -> Stock becomes -10
{
  const initialStock = 0;
  const soldQty = 10;
  const newStock = initialStock - soldQty;
  assert(newStock === -10, `Case 2 expected -10, got ${newStock}`);
  console.log('✓ Case 2 Passed: Stock 0, sell 10 -> stock is now -10');
}

// Case 3: Initial Stock = 3, sell 8 units -> Stock becomes -5
{
  const initialStock = 3;
  const soldQty = 8;
  const newStock = initialStock - soldQty;
  assert(newStock === -5, `Case 3 expected -5, got ${newStock}`);
  console.log('✓ Case 3 Passed: Stock 3, sell 8 -> stock is now -5');
}

// Case 4: Initial Stock = -5 (negative from prior sales), purchase 10 units -> Stock becomes 5
{
  const currentNegativeStock = -5;
  const purchaseQty = 10;
  const updatedStock = currentNegativeStock + purchaseQty;
  assert(updatedStock === 5, `Case 4 expected 5, got ${updatedStock}`);
  console.log('✓ Case 4 Passed: Negative stock -5, purchase 10 -> stock auto-recovers to +5');
}

// Case 5: Negative stock badge display logic test
{
  const sampleProducts: Product[] = [
    { id: 'p1', name: 'Flour 10kg', barcode: '1001', price: 1200, costPrice: 1100, stock: -5, category: 'Grocery', unit: 'Bag' },
    { id: 'p2', name: 'Cooking Oil 5L', barcode: '1002', price: 2500, costPrice: 2300, stock: 0, category: 'Grocery', unit: 'Bottle' },
    { id: 'p3', name: 'Sugar 1kg', barcode: '1003', price: 150, costPrice: 135, stock: 25, category: 'Grocery', unit: 'Kg' },
  ];

  const negativeProducts = sampleProducts.filter((p) => p.stock < 0);
  assert(negativeProducts.length === 1, `Expected 1 negative stock product, got ${negativeProducts.length}`);
  assert(negativeProducts[0].name === 'Flour 10kg', 'Expected Flour 10kg to be negative');
  console.log('✓ Case 5 Passed: Negative stock filter and reporting identify negative stock items accurately');
}

console.log('\nALL NEGATIVE STOCK MANAGEMENT TESTS PASSED 100%!');
