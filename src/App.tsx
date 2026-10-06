import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AIAssistantView } from './components/AIAssistantView';
import { TransactionModal } from './components/TransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { User, Transaction } from './types';
import { getStoredUser, clearStoredAuth, apiGetProfile } from './services/api';

export default function App() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ai' | 'settings'>('dashboard');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Validate session on mount
  useEffect(() => {
    if (user) {
      apiGetProfile()
        .then((profile) => {
          if (profile) setUser(profile);
        })
        .catch(() => {
          // Token expired or invalid
          clearStoredAuth();
          setUser(null);
        });
    }
  }, []);

  const handleLogout = () => {
    clearStoredAuth();
    setUser(null);
    setActiveTab('dashboard');
    setIsSettingsModalOpen(false);
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const handleTransactionSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAskAIWithPrompt = (prompt: string) => {
    setAiPrompt(prompt);
    setActiveTab('ai');
  };

  if (!user) {
    return <AuthModal onSuccess={(newUser) => setUser(newUser)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'settings') setIsSettingsModalOpen(true);
        }}
        user={user}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenTransactionModal={handleOpenAddModal}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenTransactionModal={handleOpenAddModal}
            onNavigateTransactions={() => setActiveTab('transactions')}
            onAskAIWithPrompt={handleAskAIWithPrompt}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleEditTransaction}
            refreshTrigger={refreshTrigger}
            onTransactionDeleted={handleTransactionSaved}
          />
        )}

        {activeTab === 'ai' && <AIAssistantView initialPrompt={aiPrompt} />}
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSaved={handleTransactionSaved}
        initialTransaction={editingTransaction}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Finora. Laporan Keuangan Cerdas Pribadi & UMKM.</p>
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              <span className="text-emerald-700 font-medium">Sistem Aktif & Terlindungi</span>
            </span>
            <span>•</span>
            <span>Google Gemini AI</span>
            <span>•</span>
            <span>Database Relasional Terisolasi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
