import { findUserById, getTransactionsByUserId } from '../database/db';

export interface BudgetStatus {
  month: string;
  monthName: string;
  year: number;
  budgetLimit: number;
  totalExpense: number;
  totalIncome: number;
  percentageUsed: number;
  remainingBudget: number;
  overBudgetAmount: number;
  isExceeded: boolean;
  status: 'normal' | 'warning' | 'exceeded';
  alertLevel: 'info' | 'warning' | 'danger';
  message: string;
  topExpenseCategories: {
    category: string;
    amount: number;
    percentageOfExpense: number;
  }[];
}

const MONTH_NAMES_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export async function getMonthlyBudgetMonitoring(
  userId: number,
  targetMonth?: string // Format: YYYY-MM
): Promise<BudgetStatus> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User tidak ditemukan');
  }

  const now = new Date();
  const currentMonthStr = targetMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [yearStr, monthNumStr] = currentMonthStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthNumStr, 10) - 1;
  const monthName = `${MONTH_NAMES_INDO[monthIdx]} ${year}`;

  const budgetLimit = Number(user.monthly_budget_limit) > 0 ? Number(user.monthly_budget_limit) : 5000000;

  // First day and last day of target month
  const firstDay = `${currentMonthStr}-01`;
  const lastDayObj = new Date(year, monthIdx + 1, 0);
  const lastDay = `${currentMonthStr}-${String(lastDayObj.getDate()).padStart(2, '0')}`;

  const monthTransactions = await getTransactionsByUserId(userId, {
    startDate: firstDay,
    endDate: lastDay,
  });

  let totalExpense = 0;
  let totalIncome = 0;
  const categoryExpenses: Record<string, number> = {};

  monthTransactions.forEach((tx) => {
    if (tx.type === 'expense') {
      totalExpense += tx.amount;
      categoryExpenses[tx.category] = (categoryExpenses[tx.category] || 0) + tx.amount;
    } else if (tx.type === 'income') {
      totalIncome += tx.amount;
    }
  });

  const percentageUsed = budgetLimit > 0 ? Math.round((totalExpense / budgetLimit) * 1000) / 10 : 0;
  const isExceeded = totalExpense > budgetLimit;
  const overBudgetAmount = Math.max(0, totalExpense - budgetLimit);
  const remainingBudget = Math.max(0, budgetLimit - totalExpense);

  let status: 'normal' | 'warning' | 'exceeded' = 'normal';
  let alertLevel: 'info' | 'warning' | 'danger' = 'info';
  let message = '';

  if (isExceeded) {
    status = 'exceeded';
    alertLevel = 'danger';
    message = `Peringatan: Pengeluaran bulan ${monthName} telah melampaui batas anggaran sebesar Rp ${overBudgetAmount.toLocaleString('id-ID')} (${percentageUsed}% terpakai)!`;
  } else if (percentageUsed >= 80) {
    status = 'warning';
    alertLevel = 'warning';
    message = `Perhatian: Pengeluaran bulan ${monthName} telah mencapai ${percentageUsed}% dari batas anggaran bulanan. Sisa anggaran: Rp ${remainingBudget.toLocaleString('id-ID')}.`;
  } else {
    status = 'normal';
    alertLevel = 'info';
    message = `Pengeluaran bulan ${monthName} masih dalam batas aman (${percentageUsed}% terpakai). Sisa anggaran: Rp ${remainingBudget.toLocaleString('id-ID')}.`;
  }

  const topExpenseCategories = Object.entries(categoryExpenses)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({
      category,
      amount,
      percentageOfExpense: totalExpense > 0 ? Math.round((amount / totalExpense) * 1000) / 10 : 0,
    }));

  return {
    month: currentMonthStr,
    monthName,
    year,
    budgetLimit,
    totalExpense,
    totalIncome,
    percentageUsed,
    remainingBudget,
    overBudgetAmount,
    isExceeded,
    status,
    alertLevel,
    message,
    topExpenseCategories,
  };
}
