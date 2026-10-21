import 'dotenv/config';

import crypto from 'node:crypto';
import { Pool } from 'pg';
import { getPayload } from 'payload';

import config from '../payload.config';
import { normalizeItemKey } from '../shared/priceTracker';

type LegacyProduct = {
  id: number;
  canonical_name: string;
  normalized_key: string;
  unit: string;
  category: string;
};

type LegacyUser = {
  id: number;
  username: string;
  email: string;
  display_name: string;
  password_hash: string;
};

type LegacyBill = {
  id: string;
  user_id: number;
  merchant_name: string;
  branch: string | null;
  bill_number: string | null;
  bill_date: string;
  bill_time: string | null;
  category: string;
  payment_method: string | null;
  subtotal: number;
  discount_total: number;
  vat: number;
  total_amount: number;
  confidence_notes: string | null;
  file_name: string | null;
  file_type: 'image' | 'pdf' | null;
  created_at: Date;
};

type LegacyItem = {
  product_id: number;
  raw_name: string;
  canonical_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount: number;
  category: string | null;
};

const legacyConnectionString = process.env.LEGACY_DATABASE_URL;
if (!legacyConnectionString) {
  throw new Error('LEGACY_DATABASE_URL is required for migrate:legacy. Use a non-production copy of the legacy database.');
}

const legacy = new Pool({ connectionString: legacyConnectionString });
const payload = await getPayload({ config });

const rows = async <T>(sql: string, values: unknown[] = []): Promise<T[]> => (await legacy.query<T>(sql, values)).rows;

const existingDocs = async (collection: any) => {
  const result = await payload.find({ collection, limit: 0, pagination: false, depth: 0, overrideAccess: true });
  return result.docs as any[];
};

const productsByLegacyId = new Map<number, string>();
const usersByLegacyId = new Map<number, string>();

try {
  const legacyProducts = await rows<LegacyProduct>(
    'SELECT id, canonical_name, normalized_key, unit, category FROM products ORDER BY id'
  );
  const existingProducts = await existingDocs('products');
  const productByKey = new Map(existingProducts.map(product => [product.normalizedKey, String(product.id)]));

  for (const product of legacyProducts) {
    let id = productByKey.get(product.normalized_key);
    if (!id) {
      const created = await payload.create({
        collection: 'products',
        data: {
          canonicalName: product.canonical_name,
          normalizedKey: product.normalized_key || normalizeItemKey(product.canonical_name),
          unit: product.unit,
          category: product.category,
        },
        overrideAccess: true,
      });
      id = String(created.id);
      productByKey.set(product.normalized_key, id);
    }
    productsByLegacyId.set(product.id, id);
  }

  const legacyUsers = await rows<LegacyUser>(
    'SELECT id, username, email, display_name, password_hash FROM users ORDER BY id'
  );
  const existingUsers = await existingDocs('users');
  const userByUsername = new Map(existingUsers.map(user => [String(user.username).toLowerCase(), String(user.id)]));

  for (const user of legacyUsers) {
    const username = user.username.toLowerCase();
    let id = userByUsername.get(username);
    if (!id) {
      const created = await payload.create({
        collection: 'users',
        data: {
          username,
          email: user.email,
          displayName: user.display_name,
          password: crypto.randomBytes(32).toString('hex'),
          legacyPasswordHash: user.password_hash,
        } as any,
        overrideAccess: true,
        context: { skipSeed: true },
      });
      id = String(created.id);
      userByUsername.set(username, id);
    }
    usersByLegacyId.set(user.id, id);
  }

  const legacyBills = await rows<LegacyBill>(
    `SELECT id, user_id, merchant_name, branch, bill_number, bill_date, bill_time,
            category, payment_method, subtotal, discount_total, vat, total_amount,
            confidence_notes, file_name, file_type, created_at
       FROM bills ORDER BY created_at, id`
  );
  const existingBills = await existingDocs('bills');
  const existingBillIds = new Set(existingBills.map(bill => String(bill.id)));
  let importedBillItems = 0;

  for (const bill of legacyBills) {
    if (existingBillIds.has(String(bill.id))) {
      const existing = existingBills.find(item => String(item.id) === String(bill.id));
      importedBillItems += Array.isArray(existing?.items) ? existing.items.length : 0;
      continue;
    }

    const userId = usersByLegacyId.get(bill.user_id);
    if (!userId) throw new Error(`Missing migrated user for legacy user ${bill.user_id}.`);

    const items = await rows<LegacyItem>(
      `SELECT p.id AS product_id, bi.raw_name, bi.canonical_name, bi.unit,
              bi.quantity, bi.unit_price, bi.total_price, bi.discount, bi.category
         FROM bill_items bi
         JOIN products p ON p.id = bi.product_id
        WHERE bi.bill_id = $1
        ORDER BY bi.line_no`,
      [bill.id]
    );

    const mappedItems = items.map(item => {
      const product = productsByLegacyId.get(item.product_id);
      if (!product) throw new Error(`Missing migrated product for legacy product ${item.product_id}.`);
      return {
        rawName: item.raw_name,
        canonicalName: item.canonical_name,
        unit: item.unit,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price),
        discount: Number(item.discount),
        category: item.category || undefined,
        product,
      };
    });

    await payload.create({
      collection: 'bills',
      data: {
        id: String(bill.id),
        user: userId,
        merchantName: bill.merchant_name,
        branch: bill.branch || undefined,
        billNumber: bill.bill_number || undefined,
        date: String(bill.bill_date).slice(0, 10),
        time: bill.bill_time || undefined,
        category: bill.category,
        paymentMethod: bill.payment_method || undefined,
        subtotal: Number(bill.subtotal),
        discountTotal: Number(bill.discount_total),
        vat: Number(bill.vat),
        totalAmount: Number(bill.total_amount),
        confidenceNotes: bill.confidence_notes || undefined,
        fileName: bill.file_name || undefined,
        fileType: bill.file_type || undefined,
        items: mappedItems,
        createdAt: bill.created_at,
      } as any,
      overrideAccess: true,
      context: { skipNormalize: true },
    });
    existingBillIds.add(String(bill.id));
    importedBillItems += mappedItems.length;
  }

  const [legacyProductCount, legacyUserCount, legacyBillCount, legacyItemCount] = await Promise.all([
    rows<{ count: string }>('SELECT count(*)::text AS count FROM products'),
    rows<{ count: string }>('SELECT count(*)::text AS count FROM users'),
    rows<{ count: string }>('SELECT count(*)::text AS count FROM bills'),
    rows<{ count: string }>('SELECT count(*)::text AS count FROM bill_items'),
  ]);
  const [newProducts, newUsers, newBills] = await Promise.all([
    existingDocs('products'),
    existingDocs('users'),
    existingDocs('bills'),
  ]);
  const newItemCount = newBills.reduce((sum, bill) => sum + (Array.isArray(bill.items) ? bill.items.length : 0), 0);

  const counts = {
    products: { legacy: Number(legacyProductCount[0].count), payload: newProducts.length },
    users: { legacy: Number(legacyUserCount[0].count), payload: newUsers.length },
    bills: { legacy: Number(legacyBillCount[0].count), payload: newBills.length },
    billItems: { legacy: Number(legacyItemCount[0].count), payload: newItemCount },
  };
  console.log(JSON.stringify({ counts, importedBillItems }, null, 2));
  if (Object.values(counts).some(count => count.legacy !== count.payload)) {
    throw new Error('Legacy and Payload counts differ.');
  }
} finally {
  await legacy.end();
  await payload.destroy();
}
