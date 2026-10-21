import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import sharp from 'sharp';

import { Admins } from './src/payload/collections/Admins';
import { BillCategories } from './src/payload/collections/BillCategories';
import { Bills } from './src/payload/collections/Bills';
import { Products } from './src/payload/collections/Products';
import { SampleBills } from './src/payload/collections/SampleBills';
import { Users } from './src/payload/collections/Users';
import { ADMIN_ROUTE } from './src/payload/adminRoute';
import { AiSettings } from './src/payload/globals/AiSettings';
import { Lookups } from './src/payload/globals/Lookups';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: { user: Admins.slug, importMap: { baseDir: path.resolve(dirname, 'src') } },
  routes: { admin: ADMIN_ROUTE },
  collections: [Admins, Users, Products, BillCategories, Bills, SampleBills],
  globals: [AiSettings, Lookups],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET!,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    idType: 'uuid',
    allowIDOnCreate: true,
    push: process.env.NODE_ENV !== 'production',
  }),
  sharp,
});
