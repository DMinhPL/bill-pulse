import React, { useState, useRef } from 'react';
import {
  Upload,
  ScanLine,
  FileText,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Trash2,
  Calendar,
  Store,
  CreditCard,
  Receipt,
  FileCheck,
  Loader2
} from 'lucide-react';
import { Bill, BillItemWithTrend } from '../types/bill';
import { formatVND, formatPercent } from '../utils/currency';
import { enrichBillItemsWithTrends } from '../utils/priceTracker';
import { QUICK_DEMO_BILLS, SampleQuickBill } from '../data/sampleBills';
import { trackedFetch } from '../utils/api';

interface BillScannerViewProps {
  existingBills: Bill[];
  /** Resolves true once stored on the server */
  onSaveBill: (bill: Bill) => Promise<boolean>;
  onNavigateTab: (tab: 'dashboard' | 'scan' | 'watchlist' | 'bills' | 'deepdive') => void;
}

export const BillScannerView: React.FC<BillScannerViewProps> = ({
  existingBills,
  onSaveBill,
  onNavigateTab,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image');
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);

  // Scanned bill state for user review & editing before saving
  const [stagedBill, setStagedBill] = useState<{
    merchantName: string;
    branch: string;
    billNumber: string;
    date: string;
    time: string;
    category: any;
    paymentMethod: string;
    items: BillItemWithTrend[];
    subtotal: number;
    vat: number;
    discountTotal: number;
    totalAmount: number;
    confidenceNotes: string;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    setScanError(null);
    setFile(selectedFile);

    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf');
    setFileType(isPdf ? 'pdf' : 'image');

    try {
      const b64 = await fileToBase64(selectedFile);
      setFilePreview(b64);
      // Auto-trigger scan
      processBillScan(selectedFile, b64, isPdf ? 'application/pdf' : selectedFile.type || 'image/jpeg');
    } catch (err) {
      setScanError('Không thể đọc file. Vui lòng thử lại với ảnh hoặc PDF khác.');
    }
  };

  const onDropHandler = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Perform Gemini OCR and process price changes
  const processBillScan = async (fileObj: File, base64Data: string, mime: string) => {
    setIsScanning(true);
    setScanStep('1/3 Đang gửi ảnh / PDF lên máy chủ phân tích...');
    setScanError(null);

    try {
      setScanStep('2/3 Gemini AI đang đọc chi tiết từng mặt hàng & giá VND...');

      const response = await trackedFetch('/api/scan-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: mime,
          fileName: fileObj.name,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}: Lỗi máy chủ khi quét hóa đơn`);
      }

      const resData = await response.json();
      if (!resData.success || !resData.bill) {
        throw new Error(resData.error || 'Không trích xuất được hóa đơn hợp lệ');
      }

      setScanStep('3/3 Đang đối chiếu giá với lịch sử mua hàng trong quá khứ...');

      const rawBill = resData.bill;
      // Enrich with past price trend comparisons
      const enrichedItems = enrichBillItemsWithTrends(
        rawBill.items || [],
        existingBills,
        rawBill.date || new Date().toISOString().split('T')[0]
      );

      setStagedBill({
        merchantName: rawBill.merchantName || 'Cửa hàng tiện lợi',
        branch: rawBill.branch || '',
        billNumber: rawBill.billNumber || `HD-${Date.now().toString().slice(-6)}`,
        date: rawBill.date || new Date().toISOString().split('T')[0],
        time: rawBill.time || '12:00',
        category: rawBill.category || 'Supermarket',
        paymentMethod: rawBill.paymentMethod || 'Tiền mặt',
        items: enrichedItems,
        subtotal: Number(rawBill.subtotal) || Number(rawBill.totalAmount) || 0,
        vat: Number(rawBill.vat) || 0,
        discountTotal: Number(rawBill.discountTotal) || 0,
        totalAmount: Number(rawBill.totalAmount) || 0,
        confidenceNotes: rawBill.confidenceNotes || 'Quét thành công bằng AI',
        fileName: fileObj.name,
      });
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError(
        err.message || 'Có lỗi xảy ra khi quét hóa đơn. Vui lòng thử lại hoặc chọn một hóa đơn mẫu.'
      );
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  // Quick Pick Demo Bill
  const loadQuickDemo = (demo: SampleQuickBill) => {
    setFile(null);
    setFilePreview(null);
    setScanError(null);

    // Enrich demo items with existing bills
    const enriched = enrichBillItemsWithTrends(
      demo.billData.items,
      existingBills,
      demo.billData.date
    );

    setStagedBill({
      merchantName: demo.billData.merchantName,
      branch: demo.billData.branch || '',
      billNumber: demo.billData.billNumber || '',
      date: demo.billData.date,
      time: demo.billData.time || '15:00',
      category: demo.billData.category,
      paymentMethod: demo.billData.paymentMethod || 'Tiền mặt',
      items: enriched,
      subtotal: demo.billData.subtotal,
      vat: demo.billData.vat || 0,
      discountTotal: demo.billData.discountTotal || 0,
      totalAmount: demo.billData.totalAmount,
      confidenceNotes: demo.billData.confidenceNotes || 'Dữ liệu mẫu thực tế',
      fileName: demo.billData.fileName || 'sample_bill.png',
    });
  };

  // User edits item price or quantity
  const handleUpdateItem = (
    index: number,
    field: 'canonicalName' | 'unitPrice' | 'quantity',
    value: any
  ) => {
    if (!stagedBill) return;

    const updated = [...stagedBill.items];
    const item = { ...updated[index] };

    if (field === 'canonicalName') {
      item.canonicalName = value;
    } else if (field === 'unitPrice') {
      const price = Number(value) || 0;
      item.unitPrice = price;
      item.totalPrice = price * item.quantity;
      if (item.previousUnitPrice !== undefined && item.previousUnitPrice > 0) {
        item.priceDiff = price - item.previousUnitPrice;
        item.percentChange = (item.priceDiff / item.previousUnitPrice) * 100;
        if (item.priceDiff > 0) item.trendStatus = 'INCREASED';
        else if (item.priceDiff < 0) item.trendStatus = 'DECREASED';
        else item.trendStatus = 'UNCHANGED';
      }
    } else if (field === 'quantity') {
      const qty = Number(value) || 1;
      item.quantity = qty;
      item.totalPrice = item.unitPrice * qty;
    }

    updated[index] = item;
    const newTotal = updated.reduce((s, i) => s + i.totalPrice, 0) + (stagedBill.vat || 0) - (stagedBill.discountTotal || 0);

    setStagedBill({
      ...stagedBill,
      items: updated,
      subtotal: updated.reduce((s, i) => s + i.totalPrice, 0),
      totalAmount: newTotal,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!stagedBill) return;
    const updated = stagedBill.items.filter((_, i) => i !== index);
    const newSubtotal = updated.reduce((s, i) => s + i.totalPrice, 0);
    setStagedBill({
      ...stagedBill,
      items: updated,
      subtotal: newSubtotal,
      totalAmount: newSubtotal + (stagedBill.vat || 0) - (stagedBill.discountTotal || 0),
    });
  };

  const handleAddItem = () => {
    if (!stagedBill) return;
    const newItem: BillItemWithTrend = {
      id: `item_manual_${Date.now()}`,
      rawName: 'Mặt hàng mới',
      canonicalName: 'Mặt hàng mới',
      unit: 'cái',
      quantity: 1,
      unitPrice: 20000,
      totalPrice: 20000,
      discount: 0,
      category: 'Hàng tiêu dùng',
      trendStatus: 'NEW',
      priceDiff: 0,
      percentChange: 0,
    };
    const updated = [...stagedBill.items, newItem];
    const newSubtotal = updated.reduce((s, i) => s + i.totalPrice, 0);
    setStagedBill({
      ...stagedBill,
      items: updated,
      subtotal: newSubtotal,
      totalAmount: newSubtotal + (stagedBill.vat || 0) - (stagedBill.discountTotal || 0),
    });
  };

  // Finalize and save
  const handleSaveToHistory = async () => {
    if (!stagedBill || isSaving) return;

    const newBillRecord: Bill = {
      id: `bill_${Date.now()}`,
      merchantName: stagedBill.merchantName,
      branch: stagedBill.branch,
      billNumber: stagedBill.billNumber,
      date: stagedBill.date,
      time: stagedBill.time,
      category: stagedBill.category,
      paymentMethod: stagedBill.paymentMethod,
      items: stagedBill.items.map(it => ({
        id: it.id,
        rawName: it.rawName,
        canonicalName: it.canonicalName,
        unit: it.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
        discount: it.discount,
        category: it.category,
      })),
      subtotal: stagedBill.subtotal,
      vat: stagedBill.vat,
      discountTotal: stagedBill.discountTotal,
      totalAmount: stagedBill.totalAmount,
      confidenceNotes: stagedBill.confidenceNotes,
      fileName: stagedBill.fileName,
      filePreview: filePreview || undefined,
      fileType: fileType,
      createdAt: new Date().toISOString(),
    };

    setIsSaving(true);
    const saved = await onSaveBill(newBillRecord);
    setIsSaving(false);
    // On failure keep the reviewed bill on screen so nothing has to be re-scanned
    if (!saved) return;

    setStagedBill(null);
    setFile(null);
    setFilePreview(null);
    onNavigateTab('watchlist');
  };

  return (
    <div className="space-y-6">
      {/* Header Introduction */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-emerald-400" />
          <span>Quét & Đọc Hóa đơn Thông minh (Ảnh & PDF)</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Hệ thống AI tự động bóc tách từng món hàng, quy đổi số tiền VND chuẩn xác, và đối chiếu xem món nào đang tăng giá so với các lần mua trước.
        </p>
      </div>

      {!stagedBill && (
        <>
          {/* Upload Dropzone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={onDropHandler}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isScanning
                ? 'border-emerald-500/60 bg-emerald-950/20'
                : 'border-slate-700 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => e.target.files && handleFileSelect(e.target.files[0])}
            />

            {isScanning ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 animate-ping opacity-25" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Đang phân tích hóa đơn bằng Gemini AI</h4>
                  <p className="text-xs text-emerald-400 font-medium mt-1 animate-pulse">{scanStep}</p>
                </div>
                <div className="w-full max-w-xs bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full animate-indeterminate" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-md">
                  <Upload className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-200">
                    Kéo thả ảnh chụp hóa đơn hoặc tệp PDF vào đây
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Hỗ trợ tệp ảnh (PNG, JPG, WEBP) hoặc tài liệu PDF (hóa đơn VAT điện tử, WinMart, Bách Hóa Xanh, Co.opmart...)
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors shadow-md"
                >
                  Chọn tệp từ máy tính / điện thoại
                </button>
              </div>
            )}
          </div>

          {/* Scan Error Notice */}
          {scanError && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Lỗi quét hóa đơn:</strong> {scanError}
                <div className="mt-2 text-xs text-slate-300">
                  Gợi ý: Bạn có thể thử nghiệm ngay bằng cách bấm vào một trong các hóa đơn mẫu phía dưới.
                </div>
              </div>
            </div>
          )}

          {/* Quick Pick Sample Bills */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-white text-sm">
                  Thử nghiệm nhanh với Hóa đơn thực tế mẫu
                </h3>
              </div>
              <span className="text-xs text-slate-400">Không cần tải tệp ảnh lên</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3.5">
              {QUICK_DEMO_BILLS.map(demo => (
                <div
                  key={demo.id}
                  onClick={() => loadQuickDemo(demo)}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-200 group-hover:text-emerald-300 transition-colors">
                        {demo.name}
                      </span>
                      <span className="text-xs font-bold text-amber-400">
                        {formatVND(demo.totalVND)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {demo.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{demo.merchant} • {demo.date}</span>
                    <span className="text-emerald-400 font-medium group-hover:underline flex items-center gap-1">
                      Thử quét ngay →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Scanned Result Review and Price Increase Detection Card */}
      {stagedBill && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Staged Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Đã bóc tách thành công
                </span>
                <span className="text-xs text-slate-400">{stagedBill.fileName}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {stagedBill.merchantName}
              </h3>
              <p className="text-xs text-slate-400">
                {stagedBill.branch || 'Hóa đơn bán lẻ'} • Mã số: {stagedBill.billNumber} • Ngày: {stagedBill.date}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setStagedBill(null);
                  setFile(null);
                  setFilePreview(null);
                }}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Hủy & Quét lại
              </button>
              <button
                onClick={handleSaveToHistory}
                disabled={isSaving}
                aria-busy={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md flex items-center gap-1.5 transition-all disabled:opacity-80 disabled:cursor-wait"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isSaving ? 'Đang lưu...' : 'Lưu vào hệ thống theo dõi'}
              </button>
            </div>
          </div>

          {/* Quick Notice about Detected Price Trends */}
          {stagedBill.items.some(i => i.trendStatus === 'INCREASED') && (
            <div className="bg-rose-950/40 border-b border-rose-500/30 px-5 py-3 text-xs text-rose-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Phát hiện tăng giá:</strong> Có{' '}
                <span className="font-bold text-white underline">
                  {stagedBill.items.filter(i => i.trendStatus === 'INCREASED').length} mặt hàng
                </span>{' '}
                trong hóa đơn này có đơn giá cao hơn so với các lần mua trước trong cơ sở dữ liệu!
              </span>
            </div>
          )}

          {/* Items Table */}
          <div className="p-5">
            <div className="flex items-center justify-between pb-3">
              <h4 className="font-semibold text-white text-sm">
                Danh sách mặt hàng & So sánh đơn giá ({stagedBill.items.length} món)
              </h4>
              <button
                onClick={handleAddItem}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm món thủ công
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/90 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Tên mặt hàng (Chuẩn hóa)</th>
                    <th className="py-3 px-3 text-center">Số lượng</th>
                    <th className="py-3 px-3 text-right">Đơn giá (VND)</th>
                    <th className="py-3 px-4 text-center">Biến động giá</th>
                    <th className="py-3 px-4 text-right">Thành tiền</th>
                    <th className="py-3 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {stagedBill.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.canonicalName}
                          onChange={e => handleUpdateItem(idx, 'canonicalName', e.target.value)}
                          className="w-full bg-transparent text-slate-100 font-medium text-sm focus:outline-none focus:bg-slate-800 px-1 py-0.5 rounded border border-transparent focus:border-slate-600"
                        />
                        <div className="text-[11px] text-slate-400 px-1">
                          Gốc: {item.rawName} • ĐVT: {item.unit}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(idx, 'quantity', e.target.value)}
                          className="w-14 bg-slate-950 text-center text-sm font-semibold text-white px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          step="500"
                          value={item.unitPrice}
                          onChange={e => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                          className="w-28 bg-slate-950 text-right text-sm font-semibold text-white px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                        <div className="text-[11px] text-slate-400">
                          {formatVND(item.unitPrice)}
                        </div>
                      </td>

                      {/* Real-time Trend Comparison against History */}
                      <td className="py-3 px-4 text-center">
                        {item.trendStatus === 'INCREASED' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <TrendingUp className="w-3 h-3 text-rose-400" />
                              +{formatVND(item.priceDiff, { showSign: false })} ({formatPercent(item.percentChange || 0)})
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Trước: {formatVND(item.previousUnitPrice)}
                            </span>
                          </div>
                        ) : item.trendStatus === 'DECREASED' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <TrendingDown className="w-3 h-3 text-emerald-400" />
                              {formatVND(item.priceDiff, { showSign: true })} ({formatPercent(item.percentChange || 0)})
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Trước: {formatVND(item.previousUnitPrice)}
                            </span>
                          </div>
                        ) : item.trendStatus === 'UNCHANGED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            = Bằng giá cũ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/20">
                            ★ Lần đầu mua
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-white">
                        {formatVND(item.totalPrice)}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Xóa món"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Summary Footer */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
              <div className="text-xs text-slate-400 space-y-1">
                <p>• {stagedBill.confidenceNotes}</p>
                <p>• Bạn có thể chỉnh sửa trực tiếp tên, đơn giá hoặc số lượng trước khi lưu.</p>
              </div>

              <div className="text-right space-y-1">
                {stagedBill.vat > 0 && (
                  <div className="text-xs text-slate-400 flex justify-end gap-3">
                    <span>Thuế VAT:</span>
                    <span>{formatVND(stagedBill.vat)}</span>
                  </div>
                )}
                {stagedBill.discountTotal > 0 && (
                  <div className="text-xs text-emerald-400 flex justify-end gap-3">
                    <span>Khuyến mãi giảm:</span>
                    <span>-{formatVND(stagedBill.discountTotal)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-end gap-3 pt-1 border-t border-slate-800">
                  <span className="text-sm font-semibold text-slate-300">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-amber-400 tracking-tight">
                    {formatVND(stagedBill.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
