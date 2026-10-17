import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Set payload limit high enough for image and pdf uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Scan and extract bill details using Gemini 3.8 Flash
app.post('/api/scan-bill', async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName } = req.body;

    if (!fileBase64 || !mimeType) {
      return res.status(400).json({ error: 'fileBase64 and mimeType are required.' });
    }

    // Determine clean mimeType
    let cleanMime = mimeType;
    if (cleanMime.includes(';')) {
      cleanMime = cleanMime.split(';')[0].trim();
    }

    const promptText = `
You are an expert Vietnamese invoice and receipt OCR & billing auditor.
Analyze the attached bill, receipt, or invoice (image or PDF).
Extract all relevant billing details, merchant information, and individual line items with extreme accuracy.

IMPORTANT CURRENCY RULES:
- The currency is Vietnamese Dong (VND / đ / ₫).
- Vietnamese receipts often use dots (e.g. 35.000) or spaces (35 000) as thousand separators. Ensure all prices are returned as clean integer or floating numbers without dots or commas (e.g., 35000, 120000, 450000).
- If an item has quantity > 1, extract both the unit price and total price. If unit price is missing on receipt, compute unitPrice = totalPrice / quantity.
- Standardize the product names into clear, canonical Vietnamese names (e.g. "Sữa tươi tiệt trùng TH True Milk có đường 1L", "Trứng gà Ba Huân hộp 10 quả", "Thịt ba chỉ heo Meat Deli 400g").

Respond ONLY with a valid JSON object matching the following structure:
{
  "merchantName": "Name of store/vendor (e.g., WinMart, Bách Hóa Xanh, Co.opmart, Highlands Coffee, Circle K, EVN, etc.)",
  "branch": "Branch or address if shown (or empty string)",
  "billNumber": "Receipt / Invoice / POS code if shown (or empty string)",
  "date": "YYYY-MM-DD (e.g. 2026-09-15) or best approximation from bill. If year is missing, assume 2026.",
  "time": "HH:mm if available or empty string",
  "category": "One of: Supermarket, Groceries, Dining & Cafe, Utilities, Electronics & Tech, Healthcare & Pharmacy, Other",
  "paymentMethod": "Tiền mặt, Thẻ tín dụng/ghi nợ, Chuyển khoản, MoMo, VNPay, ZaloPay, or Khác",
  "items": [
    {
      "rawName": "Raw text printed on receipt",
      "canonicalName": "Clean standardized item name in Vietnamese",
      "unit": "hộp, chai, kg, gói, lốc, lon, ly, cái, phần, etc.",
      "quantity": 1,
      "unitPrice": 35000,
      "totalPrice": 35000,
      "discount": 0,
      "category": "Thực phẩm, Đồ uống, Sữa - Bơ trứng, Gia dụng, Chăm sóc cá nhân, Rau củ quả, etc."
    }
  ],
  "subtotal": 150000,
  "discountTotal": 0,
  "vat": 15000,
  "totalAmount": 165000,
  "confidenceNotes": "Brief 1-sentence note in Vietnamese about extraction clarity or any specific observations"
}

Do not wrap with markdown code fences if possible, or provide strict JSON.`;

    const filePart = {
      inlineData: {
        mimeType: cleanMime,
        data: fileBase64.replace(/^data:.*?;base64,/, ''),
      },
    };

    const textPart = {
      text: promptText,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [filePart, textPart] },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      // Clean up markdown block if present
      const cleaned = responseText.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    // Sanitize items and prices
    if (parsedData.items && Array.isArray(parsedData.items)) {
      parsedData.items = parsedData.items.map((item: any, idx: number) => {
        const qty = Number(item.quantity) || 1;
        let unitPrice = Number(item.unitPrice) || 0;
        let totalPrice = Number(item.totalPrice) || 0;

        if (unitPrice === 0 && totalPrice > 0 && qty > 0) {
          unitPrice = Math.round(totalPrice / qty);
        } else if (totalPrice === 0 && unitPrice > 0 && qty > 0) {
          totalPrice = unitPrice * qty;
        }

        return {
          id: `item_${Date.now()}_${idx}`,
          rawName: item.rawName || item.canonicalName || `Sản phẩm #${idx + 1}`,
          canonicalName: item.canonicalName || item.rawName || `Sản phẩm #${idx + 1}`,
          unit: item.unit || 'cái',
          quantity: qty,
          unitPrice: Math.round(unitPrice),
          totalPrice: Math.round(totalPrice),
          discount: Number(item.discount) || 0,
          category: item.category || 'Hàng tiêu dùng',
        };
      });
    } else {
      parsedData.items = [];
    }

    parsedData.totalAmount = Number(parsedData.totalAmount) || parsedData.items.reduce((s: number, i: any) => s + (i.totalPrice || 0), 0);
    parsedData.subtotal = Number(parsedData.subtotal) || parsedData.totalAmount;
    parsedData.discountTotal = Number(parsedData.discountTotal) || 0;
    parsedData.vat = Number(parsedData.vat) || 0;
    parsedData.fileName = fileName || 'bill.jpg';

    return res.json({ success: true, bill: parsedData });
  } catch (error: any) {
    console.error('Error scanning bill with Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Failed to scan bill. Please ensure Gemini API key is configured.',
    });
  }
});

// Endpoint: AI inflation summary analysis
app.post('/api/analyze-inflation', async (req, res) => {
  try {
    const { itemsComparison } = req.body;
    if (!itemsComparison || !Array.isArray(itemsComparison) || itemsComparison.length === 0) {
      return res.status(400).json({ error: 'itemsComparison array is required.' });
    }

    const promptText = `
You are a personal financial advisor and grocery inflation expert in Vietnam.
Analyze these price change trends of items bought by the user in VND:
${JSON.stringify(itemsComparison.slice(0, 20), null, 2)}

Provide a concise, encouraging, and actionable Vietnamese analysis (2-3 paragraphs or bullet points):
1. Key items that increased the most in price (Tăng giá mạnh nhất) and possible reasons (seasonal, commodity inflation, fuel costs).
2. Items that had stable or decreased prices (Tiết kiệm hoặc bình ổn).
3. 2-3 smart shopping tips in Vietnam (e.g. buying in bulk at big supermarkets, looking for loyalty points at WinMart/Co.opmart, shopping in season).
Return as a short JSON object:
{
  "summary": "Tóm tắt ngắn gọn 1 câu về tình hình giá cả",
  "insights": ["Điểm lưu ý 1", "Điểm lưu ý 2", "Điểm lưu ý 3"],
  "recommendations": ["Lời khuyên 1", "Lời khuyên 2"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, analysis: parsed });
  } catch (err: any) {
    console.error('Error analyzing inflation:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
