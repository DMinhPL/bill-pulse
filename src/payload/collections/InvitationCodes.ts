import { randomBytes } from 'crypto';
import { ValidationError, type CollectionBeforeValidateHook, type CollectionConfig, type PayloadRequest } from 'payload';

import { isAdmin } from '../access/isAdmin';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-Z0-9]{8}$/;

function generateCode() {
  const bytes = randomBytes(8);
  return Array.from(bytes, byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

async function generateUniqueCode(req: PayloadRequest) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateCode();
    const existing = await req.payload.find({
      collection: 'invitation-codes',
      where: { code: { equals: code } },
      limit: 1,
      overrideAccess: true,
      req,
    });

    if (!existing.docs.length) return code;
  }

  throw new Error('Unable to generate a unique invitation code.');
}

const normalizeAndGenerateCode: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data;

  const code = String(data.code || '').trim().toUpperCase();
  data.code = code || await generateUniqueCode(req);

  if (!CODE_RE.test(data.code)) {
    throw new Error('Mã mời phải gồm đúng 8 ký tự chữ và số viết hoa.');
  }

  const existing = await req.payload.find({
    collection: 'invitation-codes',
    where: {
      and: [
        { code: { equals: data.code } },
        ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
      ],
    },
    limit: 1,
    overrideAccess: true,
    req,
  });

  if (existing.docs.length) {
    throw new ValidationError({
      errors: [{ path: 'code', message: 'This invitation code already exists. Please enter a different code.' }],
      req,
    });
  }

  return data;
};

export const InvitationCodes: CollectionConfig = {
  slug: 'invitation-codes',
  endpoints: [
    {
      path: '/generate',
      method: 'post',
      handler: async (req) => {
        if (req.user?.collection !== 'admins') {
          return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        try {
          return Response.json({ code: await generateUniqueCode(req) });
        } catch {
          return Response.json({ error: 'Unable to generate a unique invitation code.' }, { status: 503 });
        }
      },
    },
  ],
  admin: { useAsTitle: 'code', defaultColumns: ['code', 'enabled', 'consumedAt', 'consumedBy'], group: 'Settings' },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: { beforeValidate: [normalizeAndGenerateCode] },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 8,
      minLength: 8,
      admin: { components: { Field: './payload/components/InvitationCodeField.tsx' } },
    },
    { name: 'enabled', type: 'checkbox', defaultValue: true },
    { name: 'consumedAt', type: 'date', admin: { readOnly: true } },
    { name: 'consumedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
};
