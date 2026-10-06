import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Tag, DollarSign, FileText } from 'lucide-react';
import { Transaction } from '../types';
import { apiAddTransaction, apiUpdateTransaction, formatIDR } from '../services/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialTransaction?: Transaction | null;
}

const INCOME_CATEGORIES = [
  'Penjualan Produk',
  'Jasa & Layanan',
  'Pendapatan Bunga / Investasi',
  'Modal Usaha',
  'Piutang Terbayar',
  'Pemasukan Lainnya',
];

const EXPENSE_CATEGORIES = [
  'Bahan Baku',
  'Operasional & Utilitas',
  'Gaji Karyawan',
  'Sewa Tempat',
  'Pemasaran & Iklan',
  'Logistik & Pengiriman',
  'Pajak & Administrasi',
  'Konsumsi & Pribadi',
  'Pengeluaran Lainnya',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialTransaction,
}) => {
  const isEditing = !!initialTransaction;
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>('Bahan Baku');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      const isPreset =
        initialTransaction.type === 'income'
          ? INCOME_CATEGORIES.includes(initialTransaction.category)
          : EXPENSE_CATEGORIES.includes(initialTransaction.category);

      if (isPreset) {
        setCategory(initialTransaction.category);
        setCustomCategory('');
      } else {
        setCategory('custom');
        setCustomCategory(initialTransaction.category);
      }

      setAmount(initialTransaction.amount.toString());
      setTransactionDate(initialTransaction.transaction_date);
      setDescription(initialTransaction.description || '');
    } else {
      setType('expense');
      setCategory(EXPENSE_CATEGORIES[0]);
      setCustomCategory('');
      setAmount('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
    setError(null);
  }, [initialTransaction, isOpen]);

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    if (newType === 'income') {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Nominal harus lebih dari 0');
      return;
    }

    const finalCategory = category === 'custom' ? customCategory.trim() : category;
    if (!finalCategory) {
      setError('Kategori tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && initialTransaction) {
        await apiUpdateTransaction(initialTransaction.id, {
          type,
          category: finalCategory,
          amount: numericAmount,
          description,
          transaction_date: transactionDate,
        });
      } else {
        await apiAddTransaction({
          type,
          category: finalCategory,
          amount: numericAmount,
          description,
          transaction_date: transactionDate,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? 'Ubah Catatan Transaksi' : 'Tambah Transaksi Baru'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Type Selector (Pemasukan / Pengeluaran) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  type === 'income'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Pemasukan</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  type === 'expense'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm ring-2 ring-rose-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>Pengeluaran</span>
              </button>
            </div>
          </div>

          {/* Nominal Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">Rp</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Terbaca: <span className="text-slate-800">{formatIDR(Number(amount))}</span>
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Kategori
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="custom">+ Kategori Lainnya (Tulis Sendiri)</option>
              </select>
            </div>
          </div>

          {category === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Nama Kategori Kustom
              </label>
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Contoh: Renovasi Dapur, Lisensi Software"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Tanggal Transaksi
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Deskripsi / Catatan (Opsional)
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan tambahan seperti nama vendor, nomor nota, atau klien..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-sm font-medium shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Catat Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
