import type { CollectionAfterChangeHook } from 'payload';

export async function seedSampleBillsForUser(userId: string, req: any) {
  const { docs } = await req.payload.find({ collection: 'sample-bills', pagination: false, depth: 0, req });
  for (const sample of docs) {
    const { id, createdAt, updatedAt, ...bill } = sample;
    await req.payload.create({ collection: 'bills', data: { ...bill, user: userId }, req, overrideAccess: true });
  }
}

export const seedSampleBills: CollectionAfterChangeHook = async ({ doc, operation, req, context }) => {
  if (operation !== 'create' || context.skipSeed) return doc;
  await seedSampleBillsForUser(doc.id, req);
  return doc;
};
