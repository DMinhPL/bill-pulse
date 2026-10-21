import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { PriceTrendSummary, InflationAnalysis } from '../../shared/types/bill';
import { formatVND, formatPercent } from '../../shared/currency';
import { trackedFetch } from '../utils/api';

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceTrends: PriceTrendSummary[];
}

export const AIInsightsModal: React.FC<AIInsightsModalProps> = ({
  isOpen,
  onClose,
  priceTrends,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<InflationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (priceTrends.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      // Pick top changes for analysis
      const itemsPayload = priceTrends.map(t => ({
        name: t.canonicalName,
        category: t.category,
        currentUnitPrice: t.currentUnitPrice,
        previousUnitPrice: t.previousUnitPrice,
        priceDiff: t.priceDiff,
        percentChange: t.percentChange,
        status: t.status,
        lastStore: t.lastStore,
      }));

      const res = await trackedFetch('/api/analyze-inflation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemsComparison: itemsPayload }),
      });

      if (!res.ok) {
        throw new Error('Không thể tải phân tích từ AI lúc này');
      }

      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error('Dữ liệu phân tích không hợp lệ');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi kết nối với AI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !analysis && !loading) {
      fetchInsights();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-purple-950/40">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-950/60 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                Gemini AI Phân tích Lạm phát & Giá cả
              </h3>
              <p className="text-xs text-purple-300/80">
                Đánh giá xu hướng giỏ hàng và lời khuyên tiết kiệm chi tiêu tại Việt Nam
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-white text-base">Gemini đang phân tích dữ liệu hóa đơn...</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Đối chiếu các mặt hàng tăng giá mạnh, chu kỳ biến động và tổng hợp giải pháp chi tiêu tối ưu cho bạn.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-sm space-y-2">
              <p><strong>Không thể phân tích:</strong> {error}</p>
              <button
                onClick={fetchInsights}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Summary Statement */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-purple-100 text-sm leading-relaxed font-medium">
                "{analysis.summary}"
              </div>

              {/* Insights */}
              {analysis.insights && analysis.insights.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                    <span>Nhận định chi tiết về biến động giá:</span>
                  </h4>
                  <div className="space-y-2.5">
                    {analysis.insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed flex items-start gap-3"
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Lời khuyên mua sắm thông minh tại Việt Nam:</span>
                  </h4>
                  <div className="space-y-2.5">
                    {analysis.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs sm:text-sm text-emerald-200 leading-relaxed flex items-start gap-3"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới phân tích
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-500 hover:bg-purple-600 text-white transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
