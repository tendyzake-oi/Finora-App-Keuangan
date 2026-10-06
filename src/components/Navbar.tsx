import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Sparkles,
  Settings,
  LogOut,
  Wallet,
  User as UserIcon,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'transactions' | 'ai' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'ai' | 'settings') => void;
  user: User | null;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenTransactionModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onOpenSettings,
  onOpenTransactionModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">Finora</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  UMKM & Personal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Smart Financial Management</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              <span>Transaksi</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Finora AI</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onOpenTransactionModal}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all"
            >
              <span className="text-lg leading-none font-bold">+</span>
              <span className="hidden sm:inline">Tambah Transaksi</span>
              <span className="sm:hidden">Catat</span>
            </button>

            {user && (
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <button
                  onClick={onOpenSettings}
                  className="flex items-center space-x-2 hover:bg-slate-100 p-1.5 rounded-xl transition"
                  title="Pengaturan Akun"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-medium text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight max-w-[120px] truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">
                      {user.email}
                    </p>
                  </div>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1 px-3 ${
              activeTab === 'dashboard' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center py-1 px-3 ${
              activeTab === 'transactions' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <ReceiptText className="w-4 h-4 mb-0.5" />
            <span>Transaksi</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex flex-col items-center py-1 px-3 ${
              activeTab === 'ai' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span>Finora AI</span>
          </button>
          <button
            onClick={onOpenSettings}
            className={`flex flex-col items-center py-1 px-3 ${
              activeTab === 'settings' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Settings className="w-4 h-4 mb-0.5" />
            <span>Pengaturan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
