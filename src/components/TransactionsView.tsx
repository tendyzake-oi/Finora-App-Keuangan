import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Download,
  Calendar,
  X,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { Transaction } from '../types';
import {
  apiGetTransactions,
  apiDeleteTransaction,
  formatIDR,
  formatDateIndo,
} from '../services/api';

interface TransactionsViewProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  refreshTrigger: number;
  onTransactionDeleted?: () => void;
}

const DEFAULT_CATEGORIES = [
  'Penjualan Produk',
  'Jasa & Layanan',
  'Pendapatan Bunga / Investasi',
  'Modal Usaha',
  'Piutang Terbayar',
  'Bahan Baku',
  'Operasional & Utilitas',
  'Gaji Karyawan',
  'Sewa Tempat',
  'Pemasaran & Iklan',
  'Logistik & Pengiriman',
  'Pajak & Administrasi',
  'Konsumsi & Pribadi',
];

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddModal,
  onEditTransaction,
  refreshTrigger,
  onTransactionDeleted,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await apiGetTransactions({
        type: typeFilter === 'all' ? undefined : typeFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search.trim() || undefined,
      });
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, startDate, endDate, refreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await apiDeleteTransaction(deleteCandidate.id);
      setDeleteCandidate(null);
      fetchTransactions();
      onTransactionDeleted?.();
    } catch (err: any) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  // ==============================================================
  // DOWNLOAD CSV FEATURE IMPLEMENTATION FOR EXTERNAL REPORTING
  // ==============================================================
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    setIsExporting(true);

    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];

      // Calculate totals for currently filtered transactions
      const filteredIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const filteredExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const filteredNet = filteredIncome - filteredExpense;

      // Professional Metadata Header Block for External Financial Reporting
      const headerLines = [
        'LAPORAN TRANSAKSI KEUANGAN FINORA',
        `"Waktu Ekspor:","${dateStr} ${timeStr}"`,
        `"Filter Tipe Transaksi:","${
          typeFilter === 'all'
            ? 'Semua (Pemasukan & Pengeluaran)'
            : typeFilter === 'income'
            ? 'Pemasukan Saja'
            : 'Pengeluaran Saja'
        }"`,
        `"Filter Kategori:","${categoryFilter === 'all' ? 'Semua Kategori' : categoryFilter}"`,
        `"Rentang Tanggal:","${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}"`,
        `"Kata Kunci Pencarian:","${search || '-'}"`,
        `"Total Baris Transaksi Terfilter:","${transactions.length} transaksi"`,
        `"Total Pemasukan:","Rp ${filteredIncome.toLocaleString('id-ID')}"`,
        `"Total Pengeluaran:","Rp ${filteredExpense.toLocaleString('id-ID')}"`,
        `"Saldo Bersih (Net Cash Flow):","Rp ${filteredNet.toLocaleString('id-ID')}"`,
        '',
        'No,ID Transaksi,Tanggal Transaksi,Jenis Transaksi,Kategori,Nominal (IDR),Arus Kas (+/-),Deskripsi / Catatan,Waktu Dibuat',
      ];

      // Data Rows
      const dataRows = transactions.map((t, index) => {
        const typeLabel = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        const flowDirection = t.type === 'income' ? `+${t.amount}` : `-${t.amount}`;
        const cleanCategory = `"${(t.category || '').replace(/"/g, '""')}"`;
        const cleanDesc = `"${(t.description || '').replace(/"/g, '""')}"`;
        return [
          index + 1,
          t.id,
          t.transaction_date,
          typeLabel,
          cleanCategory,
          t.amount,
          flowDirection,
          cleanDesc,
          t.created_at,
        ].join(',');
      });

      // Bottom Summary Row
      const footerRow = [
        '"TOTAL"',
        '""',
        '""',
        '""',
        '""',
        `"Pemasukan: ${filteredIncome} | Pengeluaran: ${filteredExpense}"`,
        `"Net: ${filteredNet}"`,
        '"Laporan diekspor resmi dari Aplikasi Finora"',
        '""',
      ].join(',');

      // Prepend UTF-8 BOM (\uFEFF) for seamless opening in Microsoft Excel and Google Sheets
      const csvContent =
        '\uFEFF' + [...headerLines, ...dataRows, '', footerRow].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);

      const filterTag =
        typeFilter === 'all' ? 'Semua' : typeFilter === 'income' ? 'Pemasukan' : 'Pengeluaran';
      const filename = `Finora_Laporan_Transaksi_${filterTag}_${dateStr}.csv`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccessMessage(
        `File CSV berhasil diunduh: "${filename}" (${transactions.length} transaksi)`
      );
      setTimeout(() => setDownloadSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Error downloading CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Combine unique categories from dataset and default presets
  const dynamicCategories = Array.from(
    new Set([...transactions.map((t) => t.category), ...DEFAULT_CATEGORIES])
  ).filter(Boolean);

  // Calculate totals for filtered list
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Download Success Alert Toast */}
      {downloadSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 text-emerald-950 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>{downloadSuccessMessage}</span>
          </div>
          <button
            onClick={() => setDownloadSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Transaksi</h1>
          <p className="text-xs text-slate-500">
            Kelola, telusuri, dan ekspor laporan transaksi terfilter untuk pembukuan atau pelaporan eksternal.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Download CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0 || isExporting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-300 text-slate-800 bg-white hover:bg-slate-50 active:scale-95 shadow-xs transition disabled:opacity-40"
            title="Download CSV Laporan Transaksi Terfilter"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download CSV</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-1.5 py-0.5 rounded-md">
              {transactions.length}
            </span>
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari deskripsi atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </form>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Tipe Transaksi</option>
              <option value="income">🟢 Pemasukan Saja</option>
              <option value="expense">🔴 Pengeluaran Saja</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kategori</option>
              {dynamicCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[10px] uppercase font-bold text-slate-400">
              Dari:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date to */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[10px] uppercase font-bold text-slate-400">
              Sampai:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-14 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Filter Stats Badge & Download link */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-600">
            <span>
              Menampilkan <strong>{transactions.length}</strong> transaksi terfilter
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-emerald-700 font-semibold">
              Pemasukan: +{formatIDR(totalIncome)}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-rose-700 font-semibold">
              Pengeluaran: -{formatIDR(totalExpense)}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className={netBalance >= 0 ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold'}>
              Net: {formatIDR(netBalance)}
            </span>
          </div>

          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            {transactions.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-semibold text-xs transition"
                title="Download CSV Langsung"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Laporan ({transactions.length})</span>
              </button>
            )}

            {(search || typeFilter !== 'all' || categoryFilter !== 'all' || startDate || endDate) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center space-x-1 text-slate-500 hover:text-rose-600 transition font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <span className="inline-block animate-spin mr-2">⏳</span> Memuat data transaksi...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-2">
            <p>Tidak ada transaksi yang cocok dengan kriteria pencarian.</p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-1 text-emerald-600 font-semibold text-xs hover:underline"
            >
              <span>+ Tambah transaksi baru sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Kategori & Deskripsi</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4 text-right">Nominal</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                      {formatDateIndo(tx.transaction_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{tx.category}</div>
                      {tx.description && (
                        <div className="text-slate-500 text-xs truncate max-w-xs sm:max-w-md">
                          {tx.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <>
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            <span>Pemasukan</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            <span>Pengeluaran</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right whitespace-nowrap font-bold ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {formatIDR(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Ubah Transaksi"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(tx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Hapus Transaksi Ini?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Transaksi <strong>{deleteCandidate.category}</strong> sebesar{' '}
                <strong>{formatIDR(deleteCandidate.amount)}</strong> pada tanggal{' '}
                {formatDateIndo(deleteCandidate.transaction_date)} akan dihapus permanen.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-sm disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
