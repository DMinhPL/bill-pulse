import React, { useState } from 'react';
import { ScanLine } from 'lucide-react';
import { Bill } from '../types/bill';
import { AppTab } from '../types/navigation';
import {
  BillAttachment,
  StagedBill,
  createManualStagedBill,
  getStagedBillError,
  stagedBillFromDemo,
  stagedBillFromScan,
  stagedBillToBill,
} from './scanner/stagedBill';
import { BillUploadPanel } from './scanner/BillUploadPanel';
import { ManualEntryPrompt } from './scanner/ManualEntryPrompt';
import { QuickDemoBills } from './scanner/QuickDemoBills';
import { BillReviewEditor } from './scanner/BillReviewEditor';

interface BillScannerViewProps {
  existingBills: Bill[];
  /** Resolves true once stored on the server */
  onSaveBill: (bill: Bill) => Promise<boolean>;
  onNavigateTab: (tab: AppTab) => void;
}

/**
 * Scan page flow: get a bill (AI scan, sample, or manual entry), review/edit it,
 * then save. Each step lives in ./scanner; this component only holds the state
 * that crosses steps.
 */
export const BillScannerView: React.FC<BillScannerViewProps> = ({
  existingBills,
  onSaveBill,
  onNavigateTab,
}) => {
  const [stagedBill, setStagedBill] = useState<StagedBill | null>(null);
  // The scanned file, kept to be stored with the bill (none for samples / manual entry)
  const [attachment, setAttachment] = useState<BillAttachment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Validation messages appear only after a save attempt, not on a fresh blank form
  const [showValidation, setShowValidation] = useState(false);

  const stage = (bill: StagedBill, file: BillAttachment | null = null) => {
    setShowValidation(false);
    setAttachment(file);
    setStagedBill(bill);
  };

  const discard = () => {
    setStagedBill(null);
    setAttachment(null);
  };

  const handleSave = async () => {
    if (!stagedBill || isSaving) return;

    if (getStagedBillError(stagedBill)) {
      setShowValidation(true);
      return;
    }

    setIsSaving(true);
    const saved = await onSaveBill(stagedBillToBill(stagedBill, attachment));
    setIsSaving(false);
    // On failure keep the reviewed bill on screen so nothing has to be re-scanned
    if (!saved) return;

    discard();
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

      {stagedBill ? (
        <BillReviewEditor
          bill={stagedBill}
          existingBills={existingBills}
          onChange={setStagedBill}
          isSaving={isSaving}
          showValidation={showValidation}
          onCancel={discard}
          onSave={handleSave}
        />
      ) : (
        <BillUploadPanel
          onScanned={(rawBill, fileName, file) =>
            stage(stagedBillFromScan(rawBill, fileName, existingBills), file)
          }
          idleContent={
            <>
              <ManualEntryPrompt onStart={() => stage(createManualStagedBill(existingBills))} />
              <QuickDemoBills onPick={demo => stage(stagedBillFromDemo(demo, existingBills))} />
            </>
          }
        />
      )}
    </div>
  );
};
