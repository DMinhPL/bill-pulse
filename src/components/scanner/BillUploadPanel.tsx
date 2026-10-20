import React, { useMemo, useRef, useState } from 'react';
import { Upload, Camera, FileText, Sparkles, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { trackedFetch } from '../../utils/api';
import { prepareBillImage } from '../../utils/image';
import {
  MAX_BILL_FILE_SIZE_BYTES,
  MAX_BILL_FILE_SIZE_LABEL,
  isAllowedBillMimeType,
} from '../../../shared/billUpload';
import { BillAttachment } from './stagedBill';

interface BillUploadPanelProps {
  /** Called with the raw JSON bill returned by /api/scan-bill */
  onScanned: (rawBill: any, fileName: string, attachment: BillAttachment) => void;
  /** Shown below the upload area only while nothing is selected or in progress */
  idleContent?: React.ReactNode;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

/** File / camera selection, preview before scanning, and the Gemini scan request */
export const BillUploadPanel: React.FC<BillUploadPanelProps> = ({ onScanned, idleContent }) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image');
  const [fileMime, setFileMime] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // `capture` is ignored on desktop (it just opens the file picker), so only
  // offer the camera button on touch devices
  const canUseCamera = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches,
    []
  );

  const resetFileInputs = () => {
    // Allow re-selecting the same file / retaking right after a rejection
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const clearSelection = () => {
    setFile(null);
    setFilePreview(null);
    setFileMime(null);
  };

  // Validate, shrink photos, and stage the file for review. Scanning starts only
  // once the user confirms the preview, so blurry camera shots can be retaken
  // without spending a Gemini call.
  const handleFileSelect = async (selectedFile: File) => {
    setScanError(null);
    resetFileInputs();
    clearSelection();

    const isPdf =
      selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');

    setIsPreparing(true);
    try {
      let prepared = selectedFile;
      if (!isPdf) {
        try {
          prepared = await prepareBillImage(selectedFile);
        } catch {
          setScanError('Không đọc được ảnh này. Vui lòng chọn ảnh PNG, JPG, WEBP hoặc tệp PDF.');
          return;
        }
      }

      const mimeType = isPdf ? 'application/pdf' : prepared.type.toLowerCase();
      if (!isAllowedBillMimeType(mimeType)) {
        setScanError('Định dạng tệp không được hỗ trợ. Vui lòng chọn ảnh PNG, JPG, WEBP hoặc tệp PDF.');
        return;
      }

      if (prepared.size > MAX_BILL_FILE_SIZE_BYTES) {
        setScanError(`Tệp vượt quá giới hạn ${MAX_BILL_FILE_SIZE_LABEL}. Vui lòng chọn tệp nhỏ hơn.`);
        return;
      }

      const b64 = await fileToBase64(prepared);
      setFile(prepared);
      setFileType(isPdf ? 'pdf' : 'image');
      setFileMime(mimeType);
      setFilePreview(b64);
    } catch (err) {
      setScanError('Không thể đọc file. Vui lòng thử lại với ảnh hoặc PDF khác.');
    } finally {
      setIsPreparing(false);
    }
  };

  const onDropHandler = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Perform Gemini OCR; price comparison happens once the parent stages the result
  const startScan = async () => {
    if (!file || !filePreview || !fileMime) return;

    setIsScanning(true);
    setScanStep('1/3 Đang gửi ảnh / PDF lên máy chủ phân tích...');
    setScanError(null);

    try {
      setScanStep('2/3 Gemini AI đang đọc chi tiết từng mặt hàng & giá VND...');

      const response = await trackedFetch('/api/scan-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: filePreview,
          mimeType: fileMime,
          fileName: file.name,
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
      onScanned(resData.bill, file.name, { preview: filePreview, type: fileType });
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

  const isIdle = !file && !isScanning && !isPreparing;
  const retakeWithCamera = canUseCamera && fileType === 'image';

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,.pdf"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />
      {/* Hands off to the OS camera app: no getUserMedia permission is requested by
          the page. Browsers that ignore `capture` (e.g. Zalo/Facebook in-app
          browsers) fall back to the gallery, which flows through the same handler. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />

      {/* Review captured / selected file before spending a scan */}
      {file && filePreview && !isScanning ? (
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-white text-sm">Kiểm tra hóa đơn trước khi quét</h3>
            <span className="text-xs text-slate-400 truncate">{file.name}</span>
          </div>

          {fileType === 'image' ? (
            <img
              src={filePreview}
              alt="Ảnh hóa đơn đã chọn"
              className="w-full max-h-[60vh] object-contain rounded-xl bg-slate-950 border border-slate-800"
            />
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <FileText className="w-8 h-8 text-emerald-400 shrink-0" />
              <span className="text-sm text-slate-200 truncate">{file.name}</span>
            </div>
          )}

          {fileType === 'image' && (
            <p className="text-xs text-slate-400">
              Đảm bảo ảnh rõ nét, đủ sáng và thấy toàn bộ danh sách món hàng cùng tổng tiền.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={startScan}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {scanError ? 'Thử quét lại' : 'Quét hóa đơn'}
            </button>
            <button
              type="button"
              onClick={() => (retakeWithCamera ? cameraInputRef : fileInputRef).current?.click()}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-2 transition-colors"
            >
              {retakeWithCamera ? <Camera className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
              {retakeWithCamera ? 'Chụp lại' : 'Chọn tệp khác'}
            </button>
            <button
              type="button"
              onClick={() => {
                clearSelection();
                setScanError(null);
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        /* Upload Dropzone */
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={onDropHandler}
          onClick={() => !isScanning && !isPreparing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
            isScanning || isPreparing
              ? 'border-emerald-500/60 bg-emerald-950/20'
              : 'cursor-pointer border-slate-700 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-900'
          }`}
        >
          {isPreparing ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm text-slate-300">Đang tối ưu ảnh hóa đơn...</p>
            </div>
          ) : isScanning ? (
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
                  Hỗ trợ PNG, JPG, WEBP hoặc PDF, dung lượng tối đa {MAX_BILL_FILE_SIZE_LABEL}.
                </p>
              </div>
              <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                {canUseCamera && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation(); // don't also trigger the dropzone's file picker
                      cameraInputRef.current?.click();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    Chụp hóa đơn bằng camera
                  </button>
                )}
                <button
                  type="button"
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-md ${
                    canUseCamera
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                  }`}
                >
                  Chọn tệp từ máy tính / điện thoại
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scan Error Notice */}
      {scanError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Lỗi quét hóa đơn:</strong> {scanError}
            <div className="mt-2 text-xs text-slate-300">
              Gợi ý: Bạn có thể thử lại với ảnh rõ hơn, nhập hóa đơn thủ công, hoặc thử một hóa đơn mẫu phía dưới.
            </div>
          </div>
        </div>
      )}

      {isIdle && idleContent}
    </>
  );
};
