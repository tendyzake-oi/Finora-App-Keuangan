import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Target,
  ShieldAlert,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { DashboardData, BudgetStatus } from '../types';
import { apiGetDashboardStats, formatIDR, formatDateIndo } from '../services/api';
import { BudgetModal } from './BudgetModal';

interface DashboardViewProps {
  onOpenTransactionModal: () => void;
  onNavigateTransactions: () => void;
  onAskAIWithPrompt: (prompt: string) => void;
  refreshTrigger?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenTransactionModal,
  onNavigateTransactions,
  onAskAIWithPrompt,
  refreshTrigger,
}) => {
  const [period, setPeriod] = useState<string>('all');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const fetchStats = async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const stats = await apiGetDashboardStats(selectedPeriod);
      if (stats) setData(stats);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(period);
  }, [period, refreshTrigger]);

  const handleBudgetUpdated = (updatedBudget: BudgetStatus) => {
    if (data) {
      setData({
        ...data,
        budget: updatedBudget,
      });
    }
  };

  const summary = data?.summary || {
    netBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    transactionCount: 0,
    savingsRate: 0,
  };

  const budget = data?.budget;

  // Find max monthly amount for proportional chart bars
  const maxMonthlyVal = Math.max(
    ...(data?.monthlyTrends || []).map((m) => Math.max(m.income, m.expense)),
    1000000
  );

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ringkasan Keuangan</h1>
          <p className="text-xs text-slate-500">
            Pantau arus kas, batas anggaran bulanan, performa laba/rugi, dan kesehatan finansial usaha Anda.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Period selector */}
          <div className="relative inline-flex items-center">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
            >
              <option value="all">Semua Waktu</option>
              <option value="this_month">Bulan Ini</option>
              <option value="last_month">Bulan Lalu</option>
              <option value="this_year">Tahun Ini</option>
            </select>
          </div>

          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
            title="Atur Batas Anggaran Bulanan"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Batas Anggaran</span>
          </button>

          <button
            onClick={() => fetchStats(period)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VISUAL ALERT: BUDGET EXCEEDED BANNER */}
      {/* ============================================================== */}
      {budget && budget.isExceeded && (
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-50 via-rose-100/90 to-red-100 border-2 border-rose-500 rounded-3xl p-5 sm:p-6 shadow-md shadow-rose-500/10 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/30">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  <span>Peringatan Keuangan</span>
                  <span>•</span>
                  <span>Over Budget {budget.percentageUsed}%</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-rose-950 tracking-tight">
                  Pengeluaran Bulan Ini Telah Melebihi Batas Anggaran!
                </h3>
                <p className="text-xs sm:text-sm text-rose-800 leading-relaxed max-w-2xl">
                  Total pengeluaran Anda pada bulan <strong>{budget.monthName}</strong> telah mencapai{' '}
                  <strong className="text-rose-950">{formatIDR(budget.totalExpense)}</strong>, melampaui batas anggaran bulanan (
                  <strong className="text-slate-800">{formatIDR(budget.budgetLimit)}</strong>) sebesar{' '}
                  <strong className="text-rose-900 bg-rose-200/80 px-1.5 py-0.5 rounded font-black">
                    +{formatIDR(budget.overBudgetAmount)}
                  </strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() =>
                  onAskAIWithPrompt(
                    `Pengeluaran saya bulan ini telah melebihi batas anggaran sebesar ${formatIDR(
                      budget.overBudgetAmount
                    )} (${budget.percentageUsed}% terpakai). Mohon analisis pos pengeluaran mana yang harus segera dihemat dan berikan rekomendasi rencana pemulihan arus kas yang taktis.`
                  )
                }
                className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Minta Solusi Finora AI</span>
              </button>

              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-white hover:bg-rose-50 active:scale-95 text-rose-900 border border-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Sliders className="w-4 h-4 text-rose-700" />
                <span>Ubah Batas Anggaran</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISUAL ALERT: BUDGET WARNING BANNER (80% - 99%) */}
      {/* ============================================================== */}
      {budget && !budget.isExceeded && budget.status === 'warning' && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/70 to-yellow-50 border-2 border-amber-400 rounded-3xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center space-x-1 bg-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                  <span>Waspada Anggaran ({budget.percentageUsed}%)</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-amber-950">
                  Pengeluaran Mendekati Batas Anggaran Bulanan
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Pengeluaran bulan <strong>{budget.monthName}</strong> telah mencapai{' '}
                  <strong>{formatIDR(budget.totalExpense)}</strong> ({budget.percentageUsed}%). Sisa batas anggaran Anda:{' '}
                  <strong className="text-emerald-800">{formatIDR(budget.remainingBudget)}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() =>
                  onAskAIWithPrompt(
                    `Pengeluaran saya bulan ini sudah mencapai ${budget.percentageUsed}% dari anggaran dengan sisa ${formatIDR(
                      budget.remainingBudget
                    )}. Berikan saran alokasi pengeluaran agar tidak over budget sampai akhir bulan.`
                  )
                }
                className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tips AI Hemat</span>
              </button>
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 px-3 py-2 rounded-xl text-xs font-semibold transition"
              >
                Ubah Batas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MONTHLY BUDGET MONITORING CARD (LIVE STATUS & PROGRESS) */}
      {/* ============================================================== */}
      {budget && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  budget.isExceeded
                    ? 'bg-rose-100 text-rose-700'
                    : budget.status === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Batas Anggaran Bulanan ({budget.monthName})
                </h3>
                <p className="text-xs text-slate-500">
                  Target pengeluaran maksimal: <strong>{formatIDR(budget.budgetLimit)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                  budget.isExceeded
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : budget.status === 'warning'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {budget.isExceeded ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Melebihi Budget ({budget.percentageUsed}%)</span>
                  </>
                ) : budget.status === 'warning' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mendekati Batas ({budget.percentageUsed}%)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aman ({budget.percentageUsed}%)</span>
                  </>
                )}
              </span>

              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline px-2 py-1"
              >
                Sesuaikan
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Terpakai:{' '}
                <strong
                  className={
                    budget.isExceeded
                      ? 'text-rose-600 font-bold'
                      : budget.status === 'warning'
                      ? 'text-amber-700 font-bold'
                      : 'text-slate-900 font-bold'
                  }
                >
                  {formatIDR(budget.totalExpense)}
                </strong>
              </span>

              <span className="font-semibold text-slate-700">
                {budget.isExceeded ? (
                  <span className="text-rose-600 font-bold">
                    Defisit: +{formatIDR(budget.overBudgetAmount)}
                  </span>
                ) : (
                  <span className="text-emerald-700">
                    Sisa: {formatIDR(budget.remainingBudget)}
                  </span>
                )}
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  budget.isExceeded
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                    : budget.status === 'warning'
                    ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budget.percentageUsed)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Quick Insight Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Finora AI Smart Financial Advisor</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold">
              Butuh analisis cerdas untuk efisiensi bisnis Anda?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Tanyakan langsung pada AI Gemini mengenai kondisi keuangan, tren pengeluaran, perbandingan laba, atau saran penghematan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onAskAIWithPrompt('Buat ringkasan kondisi keuangan saya.')}
              className="bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-sm transition"
            >
              📊 Ringkasan Keuangan
            </button>
            <button
              onClick={() => onAskAIWithPrompt('Berapa pengeluaran saya bulan ini?')}
              className="bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-sm transition"
            >
              💸 Pengeluaran Bulan Ini
            </button>
            <button
              onClick={() => onAskAIWithPrompt('Bandingkan pengeluaran bulan ini dengan bulan lalu.')}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-md transition"
            >
              🔍 Bandingkan Bulan Ini & Lalu
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Saldo Bersih
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                summary.netBalance >= 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-black tracking-tight ${
                summary.netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatIDR(summary.netBalance)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center">
              <span>Arus kas akumulatif periode ini</span>
            </p>
          </div>
        </div>

        {/* Total Pemasukan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pemasukan
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {formatIDR(summary.totalIncome)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Dari penjualan dan penerimaan
            </p>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pengeluaran
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 tracking-tight">
              {formatIDR(summary.totalExpense)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Biaya operasional & kebutuhan
            </p>
          </div>
        </div>

        {/* Jumlah Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jumlah Transaksi
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {summary.transactionCount}{' '}
              <span className="text-sm font-normal text-slate-500">catatan</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Rasio Tabungan:{' '}
              <span
                className={`font-semibold ${
                  summary.savingsRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {summary.savingsRate}%
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Visual Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Tren Pemasukan vs Pengeluaran
              </h3>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                <span className="text-slate-600">Pemasukan</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                <span className="text-slate-600">Pengeluaran</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          {(!data?.monthlyTrends || data.monthlyTrends.length === 0) ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Belum ada riwayat transaksi untuk grafik bulanan.
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4">
                {data.monthlyTrends.map((trend) => {
                  const incomePercent = Math.min(100, Math.round((trend.income / maxMonthlyVal) * 100));
                  const expensePercent = Math.min(100, Math.round((trend.expense / maxMonthlyVal) * 100));

                  const [yr, mo] = trend.month.split('-');
                  const monthNames = [
                    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
                  ];
                  const label = `${monthNames[parseInt(mo, 10) - 1]} ${yr}`;

                  return (
                    <div key={trend.month} className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                        <span>{label}</span>
                        <span className={trend.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          Net: {formatIDR(trend.net)}
                        </span>
                      </div>

                      {/* Income Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="text-emerald-700 font-medium">Pemasukan</span>
                          <span className="font-semibold text-emerald-800">{formatIDR(trend.income)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${incomePercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Expense Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="text-rose-700 font-medium">Pengeluaran</span>
                          <span className="font-semibold text-rose-800">{formatIDR(trend.expense)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-500"
                            style={{ width: `${expensePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Expense Category Breakdown (1 Col) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <PieChartIcon className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Pengeluaran per Kategori
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Proporsi</span>
            </div>

            {(!data?.expenseCategories || data.expenseCategories.length === 0) ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Tidak ada data pengeluaran pada periode ini.
              </div>
            ) : (
              <div className="space-y-3">
                {data.expenseCategories.slice(0, 5).map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[150px]">
                        {cat.category}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{formatIDR(cat.amount)}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onAskAIWithPrompt('Kategori pengeluaran terbesar saya apa dan bagaimana cara menguranginya?')}
              className="w-full flex items-center justify-center space-x-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 py-2.5 rounded-xl transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analisis Pengeluaran dengan AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Transaksi Terbaru</h3>
            <p className="text-xs text-slate-500">Catatan transaksi terakhir yang dibukukan</p>
          </div>
          <button
            onClick={onNavigateTransactions}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Lihat Semua Transaksi →
          </button>
        </div>

        {(!data?.recentTransactions || data.recentTransactions.length === 0) ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <p>Belum ada transaksi yang tercatat.</p>
            <button
              onClick={onOpenTransactionModal}
              className="mt-3 inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Catat Transaksi Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 leading-tight">
                      {tx.category}
                    </p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-md">
                      {tx.description || 'Tanpa catatan tambahan'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'} {formatIDR(tx.amount)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatDateIndo(tx.transaction_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Limit Setting Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentLimit={budget?.budgetLimit || 5000000}
        onBudgetUpdated={handleBudgetUpdated}
      />
    </div>
  );
};
