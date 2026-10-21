import type { CollectionAfterChangeHook } from 'payload';

export function cloneSampleBill(sample: any) {
  const { id, createdAt, updatedAt, items, ...bill } = sample;
  return {
    ...bill,
    items: Array.isArray(items)
      ? items.map(({ id: itemId, ...item }) => item)
      : items,
  };
}

export async function seedSampleBillsForUser(userId: string, req: any) {
  const { docs } = await req.payload.find({ collection: 'sample-bills', pagination: false, depth: 0, req });
  for (const sample of docs) {
    await req.payload.create({
      collection: 'bills',
      data: { ...cloneSampleBill(sample), user: userId },
      req,
      overrideAccess: true,
    });
  }
}

export const seedSampleBills: CollectionAfterChangeHook = async ({ doc, operation, req, context }) => {
  if (operation !== 'create' || context.skipSeed) return doc;
  await seedSampleBillsForUser(doc.id, req);
  return doc;
};
