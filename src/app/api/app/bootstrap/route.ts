import { json } from '../../../../server/http';
import { payload } from '../../../../server/payload';

export async function GET() {
  const p = await payload();
  const [billCategories, lookups] = await Promise.all([
    p.find({ collection: 'bill-categories', sort: 'order', pagination: false }),
    p.findGlobal({ slug: 'lookups' }),
  ]);
  return json({ billCategories: billCategories.docs, lookups });
}
