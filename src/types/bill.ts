export interface BillItem {
  id: string;
  rawName: string;
  canonicalName: string;
  unit: string;
  quantity: number;
  unitPrice: number; // in VND
  totalPrice: number; // in VND
  discount?: number; // in VND
  category?: string;
}

export type PriceTrendStatus = 'INCREASED' | 'DECREASED' | 'UNCHANGED' | 'NEW';

export interface BillItemWithTrend extends BillItem {
  previousUnitPrice?: number;
  priceDiff?: number; // current - previous
  percentChange?: number; // %
  trendStatus: PriceTrendStatus;
  firstPurchasedDate?: string;
  historicalCount?: number;
  lowestPrice?: number;
  highestPrice?: number;
}

export interface Bill {
  id: string;
  merchantName: string;
  branch?: string;
  billNumber?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  category: 'Supermarket' | 'Groceries' | 'Dining & Cafe' | 'Utilities' | 'Electronics & Tech' | 'Healthcare & Pharmacy' | 'Other';
  paymentMethod?: string;
  items: BillItem[];
  subtotal: number;
  discountTotal?: number;
  vat?: number;
  totalAmount: number; // in VND
  confidenceNotes?: string;
  fileName?: string;
  filePreview?: string; // base64 or data URL
  fileType?: 'image' | 'pdf';
  createdAt: string;
}

export interface PricePoint {
  date: string;
  unitPrice: number;
  store: string;
  billId: string;
  quantity: number;
}

export interface PriceTrendSummary {
  canonicalName: string;
  unit: string;
  category: string;
  currentUnitPrice: number;
  previousUnitPrice: number | null;
  priceDiff: number;
  percentChange: number;
  status: PriceTrendStatus;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  history: PricePoint[];
  lastPurchasedDate: string;
  lastStore: string;
  totalQuantityBought: number;
  totalSpent: number;
}

export interface InflationAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
}
