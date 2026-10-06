export interface User {
  id: number;
  name: string;
  email: string;
  monthly_budget_limit?: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
}

export interface CategorySummary {
  category: string;
  type: 'income' | 'expense';
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}

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

export interface DashboardData {
  summary: {
    netBalance: number;
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
    savingsRate: number;
  };
  period: {
    selected: string;
    startDate: string | null;
    endDate: string | null;
  };
  budget?: BudgetStatus;
  monthlyTrends: MonthlyTrend[];
  expenseCategories: CategorySummary[];
  incomeCategories: CategorySummary[];
  recentTransactions: Transaction[];
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
