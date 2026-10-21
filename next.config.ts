import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

import { ADMIN_ROUTE } from './src/payload/adminRoute';

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: `${ADMIN_ROUTE}/:path*`, headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
};

export default withPayload(nextConfig);
