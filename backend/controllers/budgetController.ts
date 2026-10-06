import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getMonthlyBudgetMonitoring } from '../services/budgetService';
import { updateUserBudgetLimit } from '../database/db';

export async function getBudgetStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
      return;
    }

    const { month } = req.query;
    const targetMonth = typeof month === 'string' && /^\d{4}-\d{2}$/.test(month) ? month : undefined;

    const monitoring = await getMonthlyBudgetMonitoring(req.user.id, targetMonth);

    res.json({
      success: true,
      data: monitoring,
    });
  } catch (error: any) {
    console.error('getBudgetStatus error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat status anggaran.' });
  }
}

export async function updateBudgetLimit(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
      return;
    }

    const { limit } = req.body;
    const numericLimit = Number(limit);

    if (isNaN(numericLimit) || numericLimit <= 0) {
      res.status(400).json({ success: false, message: 'Batas anggaran bulanan harus berupa angka lebih besar dari 0.' });
      return;
    }

    const updated = await updateUserBudgetLimit(req.user.id, numericLimit);
    if (!updated) {
      res.status(500).json({ success: false, message: 'Gagal memperbarui batas anggaran.' });
      return;
    }

    const newMonitoring = await getMonthlyBudgetMonitoring(req.user.id);

    res.json({
      success: true,
      message: 'Batas anggaran bulanan berhasil diperbarui!',
      data: newMonitoring,
    });
  } catch (error: any) {
    console.error('updateBudgetLimit error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan perubahan batas anggaran.' });
  }
}
