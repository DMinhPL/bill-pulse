import type { Request, Response } from 'express';
import app from '../server/app';

/**
 * Vercel rewrites /api/:path* to this single Function and passes the captured
 * path in the `path` query parameter. Restore the public URL before handing
 * the request to Express so its existing /api/* routers match normally.
 */
export default function handler(request: Request, response: Response): void {
  const rewrittenUrl = new URL(request.url || '/api/index', 'http://localhost');
  const apiPath = (rewrittenUrl.searchParams.get('path') || '').replace(/^\/+/, '');

  rewrittenUrl.searchParams.delete('path');
  const query = rewrittenUrl.searchParams.toString();
  request.url = `/api${apiPath ? `/${apiPath}` : ''}${query ? `?${query}` : ''}`;

  app(request, response);
}
