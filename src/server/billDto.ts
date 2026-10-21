import type { Bill } from '../../shared/types/bill';

export function toBill(doc: any): Bill {
  return {
    id: String(doc.id),
    merchantName: doc.merchantName,
    branch: doc.branch || undefined,
    billNumber: doc.billNumber || undefined,
    date: doc.date,
    time: doc.time || undefined,
    category: doc.category,
    paymentMethod: doc.paymentMethod || undefined,
    subtotal: doc.subtotal,
    discountTotal: doc.discountTotal || undefined,
    vat: doc.vat || undefined,
    totalAmount: doc.totalAmount,
    confidenceNotes: doc.confidenceNotes || undefined,
    fileName: doc.fileName || undefined,
    fileType: doc.fileType || undefined,
    createdAt: doc.createdAt,
    items: (doc.items || []).map((item: any) => ({
      id: String(item.id),
      rawName: item.rawName,
      canonicalName: item.canonicalName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      discount: item.discount || undefined,
      category: item.category || undefined,
    })),
  };
}

export function fromBill(body: any) {
  return {
    merchantName: body.merchantName,
    branch: body.branch,
    billNumber: body.billNumber,
    date: body.date,
    time: body.time,
    category: body.category,
    paymentMethod: body.paymentMethod,
    subtotal: body.subtotal,
    discountTotal: body.discountTotal,
    vat: body.vat,
    totalAmount: body.totalAmount,
    confidenceNotes: body.confidenceNotes,
    fileName: body.fileName,
    fileType: body.fileType,
    items: Array.isArray(body.items) ? body.items.map((item: any) => ({
      rawName: item.rawName,
      canonicalName: item.canonicalName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      discount: item.discount,
      category: item.category,
    })) : [],
  };
}
