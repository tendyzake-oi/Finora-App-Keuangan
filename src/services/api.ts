import { User, Transaction, DashboardData } from '../types';

const TOKEN_KEY = 'finora_auth_token';
const USER_KEY = 'finora_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message?: string; data?: T }> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error(`Gagal terhubung ke server: ${netErr.message || 'Periksa koneksi internet Anda.'}`);
  }

  let body: any;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json().catch(() => null);
  } else {
    // If non-JSON received (e.g. HTML from a rewrite error)
    if (!res.ok) {
      throw new Error(`Server error (${res.status}): Terjadi kendala pada server.`);
    }
    throw new Error('Respon server tidak valid (mengembalikan HTML alih-alih data JSON).');
  }

  if (!body) {
    throw new Error('Respon server kosong atau tidak valid.');
  }

  if (!res.ok) {
    throw new Error(body.message || `Request gagal dengan status ${res.status}`);
  }

  return body;
}

// ================= AUTH API =================

export async function apiRegister(name: string, email: string, password: string) {
  const res = await request<{ token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  if (res.data) {
    setStoredAuth(res.data.token, res.data.user);
  }
  return res.data;
}

export async function apiLogin(email: string, password: string) {
  const res = await request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.data) {
    setStoredAuth(res.data.token, res.data.user);
  }
  return res.data;
}

export async function apiGetProfile() {
  const res = await request<{ user: User }>('/api/auth/me');
  return res.data?.user;
}

export async function apiChangePassword(currentPassword: string, newPassword: string) {
  return request('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function apiResetPassword(email: string, newPassword: string) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, newPassword }),
  });
}

export async function apiDeleteAccount(password: string) {
  const res = await request('/api/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
  clearStoredAuth();
  return res;
}

// ================= TRANSACTIONS API =================

export async function apiGetTransactions(filters?: {
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.search) params.append('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await request<Transaction[]>(`/api/transactions${query}`);
  return res.data || [];
}

export async function apiAddTransaction(data: {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
}) {
  const res = await request<Transaction>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function apiUpdateTransaction(
  id: number,
  data: {
    type?: 'income' | 'expense';
    category?: string;
    amount?: number;
    description?: string;
    transaction_date?: string;
  }
) {
  const res = await request<Transaction>(`/api/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function apiDeleteTransaction(id: number) {
  return request(`/api/transactions/${id}`, {
    method: 'DELETE',
  });
}

// ================= DASHBOARD API =================

export async function apiGetDashboardStats(period: string = 'all', startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  params.append('period', period);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await request<DashboardData>(`/api/dashboard/stats?${params.toString()}`);
  return res.data;
}

// ================= BUDGET API =================

export async function apiGetBudgetStatus(month?: string) {
  const query = month ? `?month=${month}` : '';
  const res = await request<import('../types').BudgetStatus>(`/api/budget/status${query}`);
  return res.data;
}

export async function apiUpdateBudgetLimit(limit: number) {
  const res = await request<import('../types').BudgetStatus>('/api/budget/limit', {
    method: 'PUT',
    body: JSON.stringify({ limit }),
  });
  return res.data;
}

// ================= AI ASSISTANT API =================

export async function apiAskAi(question: string) {
  const res = await request<{ reply: string; metadata: any }>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
  return res.data;
}

// ================= UTILITIES =================

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
}
