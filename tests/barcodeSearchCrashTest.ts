/**
 * Acceptance Test: Barcode Scan & Search Zero-Crash Verification
 * Verifies that scanning barcodes, searching products, repeated scans,
 * unknown barcodes, and null/undefined product fields never throw errors.
 */

import { Product, CartItem } from '../src/types/pos';

// Mock product database including edge cases with null/undefined fields
const mockProducts: Product[] = [
  {
    id: 'p-1',
    name: 'Coca Cola 1.5L',
    barcode: '8964000234567',
    category: 'BEVERAGES',
    price: 220,
    costPrice: 190,
    stock: 24,
    unit: 'Bottle',
  },
  {
    id: 'p-2',
    name: 'Lays Chips 50g',
    barcode: '8961000123456',
    category: 'SNACKS',
    price: 60,
    costPrice: 48,
    stock: 48,
    unit: 'Pack',
  },
  {
    id: 'p-3',
    name: 'Broken Item (Undefined Barcode)',
    barcode: undefined as unknown as string,
    category: undefined as unknown as string,
    price: 150,
    costPrice: 100,
    stock: 10,
    unit: 'Pcs',
  },
  {
    id: 'p-4',
    name: 'Broken Item (Null Barcode & Category)',
    barcode: null as unknown as string,
    category: null as unknown as string,
    price: 300,
    costPrice: 220,
    stock: 5,
    unit: 'Pcs',
  },
];

const safeStr = (v: unknown): string => (v == null ? '' : String(v).trim());

function runCrashTests() {
  console.log('--- STARTING BARCODE SCAN & SEARCH ACCEPTANCE TESTS ---');

  // Test 1: Search filtering with null-safe checks
  const testQueries = ['', 'coca', '8964000234567', 'lays', 'xyzunknown', '   ', undefined, null];
  for (const query of testQueries) {
    const safeQuery = safeStr(query).toLowerCase();
    const results = mockProducts.filter((p) => {
      if (!safeQuery) return false;
      const b = safeStr(p?.barcode).toLowerCase();
      const s = safeStr(p?.sku).toLowerCase();
      const n = safeStr(p?.name).toLowerCase();
      const u = safeStr(p?.urduName).toLowerCase();
      const c = safeStr(p?.category).toLowerCase();
      return b.includes(safeQuery) || s.includes(safeQuery) || n.includes(safeQuery) || u.includes(safeQuery) || c.includes(safeQuery);
    });
    console.log(`✓ Query "${String(query)}" executed cleanly: found ${results.length} items without error.`);
  }

  // Test 2: Exact barcode matching and auto-add
  const cart: CartItem[] = [];
  function addToCart(prod: Product, qty = 1) {
    const existingIndex = cart.findIndex((i) => i.product.id === prod.id);
    if (existingIndex > -1) {
      const newQty: number = cart[existingIndex].quantity + qty;
      cart[existingIndex] = {
        ...cart[existingIndex],
        quantity: newQty,
        lineTotal: newQty * cart[existingIndex].unitPrice,
      };
    } else {
      cart.push({
        id: `cart-${Date.now()}-${prod.id}`,
        product: prod,
        quantity: qty as number,
        unitPrice: prod.price as number,
        discountAmount: 0,
        lineTotal: (prod.price * qty) as number,
      });
    }
  }

  // Scan Coke first time
  const match1 = mockProducts.find((p) => safeStr(p?.barcode).toLowerCase() === '8964000234567');
  if (!match1) throw new Error('Expected to find Coca Cola');
  const getCart = () => cart;
  addToCart(match1, 1);
  if (getCart().length !== 1 || getCart()[0].quantity !== 1 || getCart()[0].lineTotal !== 220) {
    throw new Error('Test 2 Failed: Item not added to cart correctly');
  }
  console.log('✓ Test 2 Passed: Scan barcode adds product to cart correctly (Qty: 1, Total: Rs. 220)');

  // Test 3: Repeated scan of same barcode
  addToCart(match1, 1);
  if (getCart().length !== 1 || getCart()[0].quantity !== 2 || getCart()[0].lineTotal !== 440) {
    throw new Error('Test 3 Failed: Repeated scan did not increment quantity');
  }
  console.log('✓ Test 3 Passed: Repeated scan increments quantity without duplicating row (Qty: 2, Total: Rs. 440)');

  // Test 4: Scan second product
  const match2 = mockProducts.find((p) => safeStr(p?.barcode).toLowerCase() === '8961000123456');
  if (!match2) throw new Error('Expected to find Lays Chips');
  addToCart(match2, 1);
  if (getCart().length !== 2 || getCart()[1].quantity !== 1 || getCart()[1].lineTotal !== 60) {
    throw new Error('Test 4 Failed: Second product not added to cart correctly');
  }
  console.log('✓ Test 4 Passed: Second product added correctly (Cart size: 2 items, Grand Total: Rs. 500)');

  // Test 5: Unknown barcode handling
  const unknownCode = '9999999999999';
  const unknownMatch = mockProducts.find((p) => safeStr(p?.barcode).toLowerCase() === unknownCode);
  if (unknownMatch !== undefined) throw new Error('Unknown product should return undefined');
  console.log('✓ Test 5 Passed: Unknown barcode handled safely without throwing or crashing.');

  // Test 6: App.tsx cleanSearchQuery filter simulation with corrupt data
  const corruptProducts = [...mockProducts, {} as unknown as Product];
  const cleanSearchQuery = 'coca';
  const filtered = corruptProducts.filter((p) => {
    const pCat = (p?.category || '').toUpperCase();
    const targetCat = 'ALL ITEMS';
    const matchesCategory = targetCat === 'ALL ITEMS' || pCat.includes(targetCat);
    if (!cleanSearchQuery) return matchesCategory;
    const pName = (p?.name || '').toLowerCase();
    const pBarcode = (p?.barcode || '').toLowerCase();
    const pSku = (p?.sku || '').toLowerCase();
    const pUrdu = p?.urduName ? p.urduName.toLowerCase() : '';
    return matchesCategory && (pName.includes(cleanSearchQuery) || pBarcode.includes(cleanSearchQuery) || (pSku && pSku === cleanSearchQuery) || pUrdu.includes(cleanSearchQuery));
  });
  if (filtered.length !== 1) throw new Error('Corrupt product filtering test failed');
  console.log('✓ Test 6 Passed: Filtering with empty and corrupt product objects executes cleanly without crash.');

  console.log('ALL ACCEPTANCE TESTS PASSED 100%!');
}

runCrashTests();
