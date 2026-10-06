import React, { useState, useEffect } from 'react';
import { X, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiUpdateBudgetLimit, formatIDR } from '../services/api';
import { BudgetStatus } from '../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: number;
  onBudgetUpdated: (updatedStatus: BudgetStatus) => void;
}

const PRESET_LIMITS = [
  3000000,
  5000000,
  7500000,
  10000000,
  15000000,
  20000000,
];

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  currentLimit,
  onBudgetUpdated,
}) => {
  const [limit, setLimit] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLimit(currentLimit ? currentLimit.toString() : '5000000');
      setError(null);
    }
  }, [isOpen, currentLimit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericLimit = parseFloat(limit.replace(/[^0-9.]/g, ''));
    if (isNaN(numericLimit) || numericLimit <= 0) {
      setError('Batas anggaran harus berupa angka lebih besar dari 0');
      return;
    }

    setLoading(true);
    try {
      const updated = await apiUpdateBudgetLimit(numericLimit);
      if (updated) {
        onBudgetUpdated(updated);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui batas anggaran');
    } finally {
      setLoading(false);
    }
  };

  const parsedLimit = Number(limit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Atur Batas Anggaran Bulanan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Tentukan target maksimal pengeluaran bulanan Anda. Finora akan memantau setiap transaksi dan memberikan peringatan visual otomatis jika mendekati atau melampaui batas ini.
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Limit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Batas Anggaran (Rupiah)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">Rp</span>
              <input
                type="number"
                min="100000"
                step="50000"
                required
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="5000000"
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            {parsedLimit > 0 && (
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Terbaca: <span className="text-emerald-700 font-semibold">{formatIDR(parsedLimit)} / bulan</span>
              </p>
            )}
          </div>

          {/* Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Pilihan Cepat
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_LIMITS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setLimit(p.toString())}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition ${
                    parsedLimit === p
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {formatIDR(p).replace(',00', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Batas Anggaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
