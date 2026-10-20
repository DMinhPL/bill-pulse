export const MAX_BILL_FILE_SIZE_BYTES = 3 * 1024 * 1024;
export const MAX_BILL_FILE_SIZE_LABEL = '3 MB';

export const ALLOWED_BILL_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export function isAllowedBillMimeType(mimeType: string): boolean {
  return ALLOWED_BILL_MIME_TYPES.includes(
    mimeType.trim().toLowerCase() as (typeof ALLOWED_BILL_MIME_TYPES)[number]
  );
}
