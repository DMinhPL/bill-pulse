import { isAllowedBillMimeType } from '../../shared/billUpload';

/** Long edge in px; enough for Gemini to read small receipt text */
const MAX_IMAGE_EDGE = 2000;
const JPEG_QUALITY = 0.85;
/** Images already small and in a supported format are uploaded untouched */
const SKIP_COMPRESSION_BELOW_BYTES = 1024 * 1024;

/**
 * Downscale and re-encode a bill photo as JPEG before upload. Phone camera
 * shots are typically 3-8 MB, above the upload limit, and HEIC photos from
 * iOS are converted to a format the server accepts.
 *
 * Rejects when the browser cannot decode the file as an image.
 */
export async function prepareBillImage(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = objectUrl;
    // <img> decoding applies EXIF orientation, so portrait shots stay upright
    await img.decode();

    const { naturalWidth: width, naturalHeight: height } = img;
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
    if (
      scale === 1 &&
      file.size <= SKIP_COMPRESSION_BELOW_BYTES &&
      isAllowedBillMimeType(file.type)
    ) {
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    // JPEG has no alpha channel; paint transparent PNG areas white instead of black
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob) throw new Error('Image encoding failed');

    const baseName = file.name.replace(/\.[^.]+$/, '') || `hoa-don-${Date.now()}`;
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
