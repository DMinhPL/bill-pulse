import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import sharp from 'sharp';

import { Admins } from './src/payload/collections/Admins';
import { ADMIN_ROUTE } from './src/payload/adminRoute';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: { user: Admins.slug, importMap: { baseDir: path.resolve(dirname, 'src') } },
  routes: { admin: ADMIN_ROUTE },
  collections: [Admins],
  globals: [],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET!,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    idType: 'uuid',
    push: process.env.NODE_ENV !== 'production',
  }),
  sharp,
});
