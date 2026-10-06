import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
  deleteUserAccount,
} from '../database/db';
import { AuthenticatedRequest, signToken } from '../middleware/auth';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Nama harus memiliki minimal 2 karakter.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      res.status(400).json({ success: false, message: 'Alamat email tidak valid.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ success: false, message: 'Password harus memiliki minimal 6 karakter.' });
      return;
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await createUser(name, email, passwordHash);
    const token = signToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registrasi akun Finora berhasil!',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          created_at: newUser.created_at,
        },
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat pendaftaran.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, message: 'Email atau password tidak sesuai.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Email atau password tidak sesuai.' });
      return;
    }

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Login berhasil. Selamat datang kembali di Finora!',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat login.' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
    return;
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        created_at: req.user.created_at,
      },
    },
  });
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Password saat ini dan password baru wajib diisi.' });
      return;
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password baru minimal harus 6 karakter.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, req.user.password_hash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Password saat ini tidak cocok.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await updateUserPassword(req.user.id, newHash);

    res.json({ success: true, message: 'Password berhasil diubah!' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui password.' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      res.status(400).json({ success: false, message: 'Email dan password baru wajib diisi.' });
      return;
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password baru minimal harus 6 karakter.' });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Security standard: don't leak user existence directly, but inform user
      res.status(404).json({ success: false, message: 'Akun dengan email tersebut tidak ditemukan.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await updateUserPassword(user.id, newHash);

    res.json({ success: true, message: 'Password akun Anda berhasil direset! Silakan login dengan password baru.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Gagal mereset password.' });
  }
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
      return;
    }

    const { password } = req.body;
    if (!password) {
      res.status(400).json({ success: false, message: 'Konfirmasi password diperlukan untuk menghapus akun.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, req.user.password_hash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Password konfirmasi salah.' });
      return;
    }

    const deleted = await deleteUserAccount(req.user.id);
    if (!deleted) {
      res.status(500).json({ success: false, message: 'Gagal menghapus akun.' });
      return;
    }

    res.json({ success: true, message: 'Akun dan semua data transaksi Finora Anda telah berhasil dihapus.' });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses penghapusan akun.' });
  }
}
