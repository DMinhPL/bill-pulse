import { GoogleGenAI } from '@google/genai';

import { MAX_BILL_FILE_SIZE_BYTES, MAX_BILL_FILE_SIZE_LABEL, isAllowedBillMimeType } from '../../shared/billUpload';
import { payload } from './payload';

const getSettings = async () => {
  const p = await payload();
  const [settings, lookups, categories] = await Promise.all([
    p.findGlobal({ slug: 'ai-settings' }),
    p.findGlobal({ slug: 'lookups' }),
    p.find({ collection: 'bill-categories', sort: 'order', pagination: false }),
  ]);
  return { p, settings: settings as any, lookups: lookups as any, categories: categories.docs as any[] };
};

export async function scanBill(body: any) {
  const { fileBase64, mimeType, fileName } = body || {};
  if (!fileBase64 || !mimeType) throw Object.assign(new Error('fileBase64 and mimeType are required.'), { status: 400 });
  if (typeof fileBase64 !== 'string' || typeof mimeType !== 'string') throw Object.assign(new Error('Dữ liệu tệp không hợp lệ.'), { status: 400 });
  let cleanMime = mimeType.trim().toLowerCase();
  if (cleanMime.includes(';')) cleanMime = cleanMime.split(';')[0].trim();
  if (!isAllowedBillMimeType(cleanMime)) throw Object.assign(new Error('Định dạng tệp không được hỗ trợ. Chỉ chấp nhận PNG, JPG, WEBP hoặc PDF.'), { status: 415 });
  const dataUrlPrefix = /^data:([^;,]+);base64,/i.exec(fileBase64);
  if (dataUrlPrefix && dataUrlPrefix[1].trim().toLowerCase() !== cleanMime) throw Object.assign(new Error('Định dạng tệp không khớp với dữ liệu đã tải lên.'), { status: 400 });
  const encodedFile = (dataUrlPrefix ? fileBase64.slice(dataUrlPrefix[0].length) : fileBase64).replace(/\s/g, '');
  if (!encodedFile || encodedFile.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encodedFile)) throw Object.assign(new Error('Dữ liệu Base64 của tệp không hợp lệ.'), { status: 400 });
  if (Buffer.byteLength(encodedFile, 'base64') > MAX_BILL_FILE_SIZE_BYTES) throw Object.assign(new Error(`Tệp vượt quá giới hạn ${MAX_BILL_FILE_SIZE_LABEL}. Vui lòng chọn tệp nhỏ hơn.`), { status: 413 });
  const { settings, lookups, categories } = await getSettings();
  const prompt = String(settings.scanPrompt || '').replace('{{categories}}', categories.map(category => category.key).join(', ')).replace('{{paymentMethods}}', (lookups.paymentMethods || []).map((item: any) => item.value).join(', '));
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || settings.model || 'gemini-3.8-flash', contents: { parts: [{ inlineData: { mimeType: cleanMime, data: encodedFile } }, { text: prompt }] }, config: { responseMimeType: 'application/json' } });
  const responseText = response.text || '{}';
  let parsed: any;
  try { parsed = JSON.parse(responseText); } catch { parsed = JSON.parse(responseText.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim()); }
  parsed.items = Array.isArray(parsed.items) ? parsed.items.map((item: any, idx: number) => {
    const quantity = Number(item.quantity) || 1;
    let unitPrice = Number(item.unitPrice) || 0;
    let totalPrice = Number(item.totalPrice) || 0;
    if (!unitPrice && totalPrice && quantity) unitPrice = Math.round(totalPrice / quantity);
    else if (!totalPrice && unitPrice && quantity) totalPrice = unitPrice * quantity;
    return { id: `item_${Date.now()}_${idx}`, rawName: item.rawName || item.canonicalName || `Sản phẩm #${idx + 1}`, canonicalName: item.canonicalName || item.rawName || `Sản phẩm #${idx + 1}`, unit: item.unit || 'cái', quantity, unitPrice: Math.round(unitPrice), totalPrice: Math.round(totalPrice), discount: Number(item.discount) || 0, category: item.category || 'Hàng tiêu dùng' };
  }) : [];
  parsed.totalAmount = Number(parsed.totalAmount) || parsed.items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
  parsed.subtotal = Number(parsed.subtotal) || parsed.totalAmount;
  parsed.discountTotal = Number(parsed.discountTotal) || 0;
  parsed.vat = Number(parsed.vat) || 0;
  parsed.fileName = fileName || 'bill.jpg';
  return parsed;
}

export async function analyzeInflation(itemsComparison: any[]) {
  const { settings } = await getSettings();
  const items = itemsComparison.slice(0, Number(settings.inflationMaxItems) || 20);
  const prompt = String(settings.inflationPrompt || '').replace('{{items}}', JSON.stringify(items, null, 2));
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || settings.model || 'gemini-3.8-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
  return JSON.parse(response.text || '{}');
}
