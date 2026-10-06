import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getTransactionsByUserId, Transaction } from '../database/db';
import { getMonthlyBudgetMonitoring } from '../services/budgetService';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
      return;
    }

    const { period, startDate: queryStart, endDate: queryEnd } = req.query;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let startDate: string | undefined = undefined;
    let endDate: string | undefined = undefined;

    if (period === 'this_month') {
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      startDate = firstDay.toISOString().split('T')[0];
      endDate = lastDay.toISOString().split('T')[0];
    } else if (period === 'last_month') {
      const firstDay = new Date(currentYear, currentMonth - 1, 1);
      const lastDay = new Date(currentYear, currentMonth, 0);
      startDate = firstDay.toISOString().split('T')[0];
      endDate = lastDay.toISOString().split('T')[0];
    } else if (period === 'this_year') {
      startDate = `${currentYear}-01-01`;
      endDate = `${currentYear}-12-31`;
    } else if (period === 'custom') {
      if (typeof queryStart === 'string') startDate = queryStart;
      if (typeof queryEnd === 'string') endDate = queryEnd;
    }
    // if 'all', startDate & endDate remain undefined

    const allUserTransactions = await getTransactionsByUserId(req.user.id);
    const filteredTransactions = await getTransactionsByUserId(req.user.id, {
      startDate,
      endDate,
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, { category: string; type: 'income' | 'expense'; amount: number; count: number }> = {};

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }

      const catKey = `${tx.type}:${tx.category}`;
      if (!categoryTotals[catKey]) {
        categoryTotals[catKey] = {
          category: tx.category,
          type: tx.type,
          amount: 0,
          count: 0,
        };
      }
      categoryTotals[catKey].amount += tx.amount;
      categoryTotals[catKey].count += 1;
    });

    const netBalance = totalIncome - totalExpense;
    const transactionCount = filteredTransactions.length;

    // Monthly breakdown for charts (last 6 months or 12 months)
    const monthlyMap: Record<string, { month: string; income: number; expense: number; net: number }> = {};

    // Sort transactions by date ascending for trend calculation
    const sortedAll = [...allUserTransactions].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));

    sortedAll.forEach((tx) => {
      const monthKey = tx.transaction_date.substring(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          income: 0,
          expense: 0,
          net: 0,
        };
      }
      if (tx.type === 'income') {
        monthlyMap[monthKey].income += tx.amount;
      } else {
        monthlyMap[monthKey].expense += tx.amount;
      }
      monthlyMap[monthKey].net = monthlyMap[monthKey].income - monthlyMap[monthKey].expense;
    });

    const monthlyTrends = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // Expense categories sorted descending
    const expenseCategories = Object.values(categoryTotals)
      .filter((c) => c.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .map((c) => ({
        ...c,
        percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 1000) / 10 : 0,
      }));

    // Income categories sorted descending
    const incomeCategories = Object.values(categoryTotals)
      .filter((c) => c.type === 'income')
      .sort((a, b) => b.amount - a.amount)
      .map((c) => ({
        ...c,
        percentage: totalIncome > 0 ? Math.round((c.amount / totalIncome) * 1000) / 10 : 0,
      }));

    // Recent 5 transactions
    const recentTransactions = filteredTransactions.slice(0, 5);

    // Monthly budget monitoring status
    const budget = await getMonthlyBudgetMonitoring(req.user.id);

    res.json({
      success: true,
      data: {
        summary: {
          netBalance,
          totalIncome,
          totalExpense,
          transactionCount,
          savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10 : 0,
        },
        period: {
          selected: period || 'all',
          startDate: startDate || null,
          endDate: endDate || null,
        },
        budget,
        monthlyTrends,
        expenseCategories,
        incomeCategories,
        recentTransactions,
      },
    });
  } catch (error: any) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat statistik dashboard.' });
  }
}
