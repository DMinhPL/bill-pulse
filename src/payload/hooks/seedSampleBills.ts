import type { CollectionAfterChangeHook } from 'payload';

export const seedSampleBills: CollectionAfterChangeHook = async ({ doc, operation, req, context }) => {
  if (operation !== 'create' || context.skipSeed) return doc;
  const { docs } = await req.payload.find({ collection: 'sample-bills', pagination: false, depth: 0, req });
  for (const sample of docs) {
    const { id, createdAt, updatedAt, ...bill } = sample;
    await req.payload.create({ collection: 'bills', data: { ...bill, user: doc.id }, req, overrideAccess: true });
  }
  return doc;
};
