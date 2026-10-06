import React, { useState } from 'react';
import { X, Lock, Trash2, CheckCircle2, AlertCircle, Database, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { apiChangePassword, apiDeleteAccount, formatDateIndo } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const [deletePassword, setDeletePassword] = useState('');
  const [delLoading, setDelLoading] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwError('Konfirmasi password baru tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      setPwError('Password baru minimal harus 6 karakter');
      return;
    }

    setPwLoading(true);
    try {
      const res = await apiChangePassword(currentPassword, newPassword);
      setPwSuccess(res.message || 'Password berhasil diperbarui!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Gagal mengubah password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDelError(null);
    setDelLoading(true);

    try {
      await apiDeleteAccount(deletePassword);
      onClose();
      onLogout();
    } catch (err: any) {
      setDelError(err.message || 'Gagal menghapus akun');
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Pengaturan Akun & Profil</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* User Profile Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm leading-tight">{user.name}</h3>
                <p className="text-xs text-slate-500 leading-tight">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                    User ID #{user.id}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Bergabung: {formatDateIndo(user.created_at.split('T')[0])}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Database & Security Info */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold text-emerald-800">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Sistem Database Finora</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Arsitektur database relasional lengkap dengan tabel <code>users</code> dan <code>transactions</code>, relasi <code>user_id</code> terisolasi, enkripsi password Bcrypt, dan konektor MySQL otomatis.
            </p>
          </div>

          {/* Change Password Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-slate-700" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ganti Password
              </h4>
            </div>

            {pwSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            {pwError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Ulangi Password Baru
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                {pwLoading ? 'Menyimpan...' : 'Perbarui Password'}
              </button>
            </form>
          </div>

          {/* Delete Account Danger Zone */}
          <div className="space-y-3 pt-4 border-t border-rose-100">
            <div className="flex items-center space-x-2 text-rose-700">
              <Trash2 className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Zona Bahaya: Hapus Akun
              </h4>
            </div>

            <p className="text-xs text-slate-500">
              Menghapus akun akan melenyapkan seluruh data transaksi dan pembukuan Anda secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
              >
                Hapus Akun Saya
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
                <p className="text-xs font-semibold text-rose-800">
                  Ketik password Anda untuk mengonfirmasi penghapusan permanen:
                </p>

                {delError && (
                  <div className="p-2 bg-white text-rose-700 text-xs rounded-lg border border-rose-200">
                    {delError}
                  </div>
                )}

                <input
                  type="password"
                  required
                  placeholder="Password Anda"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
                />

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={delLoading}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
                  >
                    {delLoading ? 'Menghapus...' : 'Konfirmasi Hapus Akun'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
