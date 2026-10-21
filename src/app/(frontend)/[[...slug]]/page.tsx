import { notFound } from 'next/navigation';

import ClientApp from '@/client/ClientApp';
import { matchesPagePath } from '@/../shared/routes';

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const pathname = '/' + slug.map(encodeURIComponent).join('/');
  if (!matchesPagePath(pathname)) notFound();
  return <ClientApp />;
}
