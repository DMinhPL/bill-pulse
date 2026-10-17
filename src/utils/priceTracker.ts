import { Bill, BillItem, BillItemWithTrend, PricePoint, PriceTrendStatus, PriceTrendSummary } from '../types/bill';

/**
 * Normalize Vietnamese text for fuzzy matching
 * E.g., "Sữa tươi TH True Milk ít đường 1L" vs "Sữa tươi TH TRUE MILK 1L (ít đường)"
 */
export function normalizeItemKey(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks for relaxed key
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determine if two product names likely represent the same item
 */
export function isSameProduct(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false;
  if (nameA.trim().toLowerCase() === nameB.trim().toLowerCase()) return true;

  const keyA = normalizeItemKey(nameA);
  const keyB = normalizeItemKey(nameB);
  if (keyA === keyB) return true;

  // Check word containment if long enough
  const wordsA = keyA.split(' ').filter(w => w.length > 2);
  const wordsB = keyB.split(' ').filter(w => w.length > 2);
  if (wordsA.length >= 3 && wordsB.length >= 3) {
    const common = wordsA.filter(w => wordsB.includes(w));
    const overlapRatio = (common.length * 2) / (wordsA.length + wordsB.length);
    if (overlapRatio > 0.8) return true;
  }

  return false;
}

/**
 * Extract all historical price points grouped by canonical item
 */
export function computePriceHistoryMap(bills: Bill[]): Map<string, PriceTrendSummary> {
  // Sort bills oldest to newest
  const sortedBills = [...bills].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const map = new Map<string, PriceTrendSummary>();

  for (const bill of sortedBills) {
    for (const item of bill.items) {
      const canonical = item.canonicalName.trim();
      const normKey = normalizeItemKey(canonical);

      // Find existing group by canonical key or fuzzy match
      let groupKey = normKey;
      let existingGroup: PriceTrendSummary | undefined = undefined;

      for (const [k, v] of map.entries()) {
        if (isSameProduct(v.canonicalName, canonical)) {
          groupKey = k;
          existingGroup = v;
          break;
        }
      }

      const point: PricePoint = {
        date: bill.date,
        unitPrice: item.unitPrice,
        store: bill.merchantName,
        billId: bill.id,
        quantity: item.quantity,
      };

      if (!existingGroup) {
        map.set(groupKey, {
          canonicalName: canonical,
          unit: item.unit || 'cái',
          category: item.category || 'Hàng tiêu dùng',
          currentUnitPrice: item.unitPrice,
          previousUnitPrice: null,
          priceDiff: 0,
          percentChange: 0,
          status: 'NEW',
          minPrice: item.unitPrice,
          maxPrice: item.unitPrice,
          avgPrice: item.unitPrice,
          history: [point],
          lastPurchasedDate: bill.date,
          lastStore: bill.merchantName,
          totalQuantityBought: item.quantity,
          totalSpent: item.totalPrice,
        });
      } else {
        const prevPrice = existingGroup.currentUnitPrice;
        const diff = item.unitPrice - prevPrice;
        const pct = prevPrice > 0 ? (diff / prevPrice) * 100 : 0;

        let status: PriceTrendStatus = 'UNCHANGED';
        if (diff > 0) status = 'INCREASED';
        else if (diff < 0) status = 'DECREASED';

        existingGroup.previousUnitPrice = prevPrice;
        existingGroup.currentUnitPrice = item.unitPrice;
        existingGroup.priceDiff = diff;
        existingGroup.percentChange = pct;
        existingGroup.status = status;
        existingGroup.lastPurchasedDate = bill.date;
        existingGroup.lastStore = bill.merchantName;
        existingGroup.history.push(point);
        existingGroup.totalQuantityBought += item.quantity;
        existingGroup.totalSpent += item.totalPrice;

        const allPrices = existingGroup.history.map(h => h.unitPrice);
        existingGroup.minPrice = Math.min(...allPrices);
        existingGroup.maxPrice = Math.max(...allPrices);
        existingGroup.avgPrice = Math.round(
          allPrices.reduce((a, b) => a + b, 0) / allPrices.length
        );
      }
    }
  }

  return map;
}

/**
 * Enrich a freshly scanned bill by comparing its items against existing bills
 */
export function enrichBillItemsWithTrends(
  billItems: BillItem[],
  existingBills: Bill[],
  currentBillDate?: string
): BillItemWithTrend[] {
  // Sort existing bills by date descending to find the most recent prior price
  const targetDate = currentBillDate ? new Date(currentBillDate).getTime() : Date.now();
  const priorBills = [...existingBills]
    .filter(b => new Date(b.date).getTime() <= targetDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return billItems.map(item => {
    let previousUnitPrice: number | undefined = undefined;
    let firstPurchasedDate: string | undefined = undefined;
    const historicalPrices: number[] = [];

    // Search backwards in time
    for (const priorBill of priorBills) {
      for (const priorItem of priorBill.items) {
        if (isSameProduct(priorItem.canonicalName, item.canonicalName)) {
          historicalPrices.push(priorItem.unitPrice);
          if (previousUnitPrice === undefined) {
            previousUnitPrice = priorItem.unitPrice;
          }
          firstPurchasedDate = priorBill.date;
        }
      }
    }

    if (previousUnitPrice === undefined) {
      return {
        ...item,
        trendStatus: 'NEW' as PriceTrendStatus,
        priceDiff: 0,
        percentChange: 0,
        lowestPrice: item.unitPrice,
        highestPrice: item.unitPrice,
        historicalCount: 1,
      };
    }

    const priceDiff = item.unitPrice - previousUnitPrice;
    const percentChange =
      previousUnitPrice > 0 ? (priceDiff / previousUnitPrice) * 100 : 0;

    let trendStatus: PriceTrendStatus = 'UNCHANGED';
    if (priceDiff > 0) trendStatus = 'INCREASED';
    else if (priceDiff < 0) trendStatus = 'DECREASED';

    const allPrices = [item.unitPrice, ...historicalPrices];
    const lowestPrice = Math.min(...allPrices);
    const highestPrice = Math.max(...allPrices);

    return {
      ...item,
      previousUnitPrice,
      priceDiff,
      percentChange,
      trendStatus,
      firstPurchasedDate,
      lowestPrice,
      highestPrice,
      historicalCount: allPrices.length,
    };
  });
}

/**
 * Filter and sort top price increases
 */
export function getTopPriceIncreases(trends: PriceTrendSummary[], limit = 5): PriceTrendSummary[] {
  return trends
    .filter(t => t.status === 'INCREASED' && t.priceDiff > 0)
    .sort((a, b) => b.percentChange - a.percentChange)
    .slice(0, limit);
}

/**
 * Filter and sort top price savings / decreases
 */
export function getTopPriceDecreases(trends: PriceTrendSummary[], limit = 5): PriceTrendSummary[] {
  return trends
    .filter(t => t.status === 'DECREASED' && t.priceDiff < 0)
    .sort((a, b) => a.percentChange - b.percentChange)
    .slice(0, limit);
}
