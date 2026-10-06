import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getTransactionsByUserId,
  findTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../database/db';

export async function getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
      return;
    }

    const { type, category, startDate, endDate, search } = req.query;

    const filterOptions: {
      type?: 'income' | 'expense';
      category?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    } = {};

    if (type === 'income' || type === 'expense') {
      filterOptions.type = type;
    }

    if (typeof category === 'string' && category.trim()) {
      filterOptions.category = category.trim();
    }

    if (typeof startDate === 'string' && startDate.trim()) {
      filterOptions.startDate = startDate.trim();
    }

    if (typeof endDate === 'string' && endDate.trim()) {
      filterOptions.endDate = endDate.trim();
    }

    if (typeof search === 'string' && search.trim()) {
      filterOptions.search = search.trim();
    }

    const transactions = await getTransactionsByUserId(req.user.id, filterOptions);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error: any) {
    console.error('getTransactions error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi.' });
  }
}

export async function getTransactionDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
      return;
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID transaksi tidak valid.' });
      return;
    }

    const tx = await findTransactionById(id, req.user.id);
    if (!tx) {
      res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    res.json({ success: true, data: tx });
  } catch (error: any) {
    console.error('getTransactionDetails error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat rincian transaksi.' });
  }
}

export async function addTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
      return;
    }

    const { type, category, amount, description, transaction_date } = req.body;

    if (!type || (type !== 'income' && type !== 'expense')) {
      res.status(400).json({ success: false, message: 'Tipe transaksi harus "income" (pemasukan) atau "expense" (pengeluaran).' });
      return;
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ success: false, message: 'Kategori wajib diisi.' });
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ success: false, message: 'Nominal transaksi harus berupa angka lebih besar dari 0.' });
      return;
    }

    if (!transaction_date || !/^\d{4}-\d{2}-\d{2}$/.test(transaction_date)) {
      res.status(400).json({ success: false, message: 'Format tanggal transaksi harus YYYY-MM-DD.' });
      return;
    }

    const newTx = await createTransaction(req.user.id, {
      type,
      category: category.trim(),
      amount: numericAmount,
      description: typeof description === 'string' ? description.trim() : '',
      transaction_date,
    });

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil ditambahkan.',
      data: newTx,
    });
  } catch (error: any) {
    console.error('addTransaction error:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan transaksi.' });
  }
}

export async function editTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
      return;
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID transaksi tidak valid.' });
      return;
    }

    const existing = await findTransactionById(id, req.user.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    const { type, category, amount, description, transaction_date } = req.body;

    const updatePayload: {
      type?: 'income' | 'expense';
      category?: string;
      amount?: number;
      description?: string;
      transaction_date?: string;
    } = {};

    if (type) {
      if (type !== 'income' && type !== 'expense') {
        res.status(400).json({ success: false, message: 'Tipe harus "income" atau "expense".' });
        return;
      }
      updatePayload.type = type;
    }

    if (category) {
      updatePayload.category = String(category).trim();
    }

    if (amount !== undefined) {
      const num = Number(amount);
      if (isNaN(num) || num <= 0) {
        res.status(400).json({ success: false, message: 'Nominal harus lebih besar dari 0.' });
        return;
      }
      updatePayload.amount = num;
    }

    if (description !== undefined) {
      updatePayload.description = String(description).trim();
    }

    if (transaction_date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction_date)) {
        res.status(400).json({ success: false, message: 'Format tanggal harus YYYY-MM-DD.' });
        return;
      }
      updatePayload.transaction_date = transaction_date;
    }

    const updated = await updateTransaction(id, req.user.id, updatePayload);

    res.json({
      success: true,
      message: 'Transaksi berhasil diperbarui.',
      data: updated,
    });
  } catch (error: any) {
    console.error('editTransaction error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui transaksi.' });
  }
}

export async function removeTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
      return;
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID transaksi tidak valid.' });
      return;
    }

    const existing = await findTransactionById(id, req.user.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan atau bukan milik Anda.' });
      return;
    }

    const deleted = await deleteTransaction(id, req.user.id);
    if (!deleted) {
      res.status(500).json({ success: false, message: 'Gagal menghapus transaksi.' });
      return;
    }

    res.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (error: any) {
    console.error('removeTransaction error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus transaksi.' });
  }
}
