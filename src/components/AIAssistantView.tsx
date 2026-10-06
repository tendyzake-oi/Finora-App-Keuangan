import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  TrendingDown,
  TrendingUp,
  Target,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { AIMessage } from '../types';
import { apiAskAi } from '../services/api';

interface AIAssistantViewProps {
  initialPrompt?: string;
}

const PRESET_GROUPS = [
  {
    icon: TrendingDown,
    label: 'Pengeluaran',
    prompts: [
      'Berapa pengeluaran saya bulan ini?',
      'Kategori pengeluaran terbesar saya apa?',
      'Bandingkan pengeluaran bulan ini dengan bulan lalu.',
    ],
  },
  {
    icon: Target,
    label: 'Batas Anggaran',
    prompts: [
      'Apakah pengeluaran saya melebihi batas anggaran bulan ini?',
      'Berapa sisa anggaran yang masih aman untuk dibelanjakan?',
    ],
  },
  {
    icon: BarChart3,
    label: 'Kondisi Finansial',
    prompts: [
      'Buat ringkasan kondisi keuangan saya.',
      'Apakah arus kas (cash flow) saya saat ini sehat?',
      'Berikan saran penghematan biaya operasional terbaik untuk usaha saya.',
    ],
  },
];

// Simple, reliable Markdown renderer for AI financial analysis
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading 3: ### Title
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="text-sm sm:text-base font-bold text-slate-900 mt-2 mb-1 flex items-center space-x-1.5"
            >
              <span>{renderBoldInline(trimmed.replace('### ', ''))}</span>
            </h4>
          );
        }

        // Heading 2: ## Title
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-base sm:text-lg font-bold text-slate-900 mt-3 mb-1">
              {renderBoldInline(trimmed.replace('## ', ''))}
            </h3>
          );
        }

        // Bullet point: - text or * text
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1 my-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <div className="text-slate-800">{renderBoldInline(trimmed.substring(2))}</div>
            </div>
          );
        }

        // Numbered list: 1. text
        const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberMatch) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1 my-0.5">
              <span className="text-emerald-700 font-bold shrink-0">{numberMatch[1]}.</span>
              <div className="text-slate-800">{renderBoldInline(numberMatch[2])}</div>
            </div>
          );
        }

        // Callout / Tip line (starting with 💡 or ⚠️ or ✅)
        if (trimmed.startsWith('💡') || trimmed.startsWith('⚠️') || trimmed.startsWith('✅')) {
          const isWarning = trimmed.startsWith('⚠️');
          const isSuccess = trimmed.startsWith('✅');
          return (
            <div
              key={idx}
              className={`p-2.5 my-2 rounded-xl border text-xs sm:text-sm font-medium ${
                isWarning
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : isSuccess
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}
            >
              {renderBoldInline(trimmed)}
            </div>
          );
        }

        // Normal paragraph
        return (
          <p key={idx} className="text-slate-800">
            {renderBoldInline(line)}
          </p>
        );
      })}
    </div>
  );
}

// Helper to highlight **bold** and currency values
function renderBoldInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      return (
        <strong key={i} className="font-semibold text-slate-950">
          {content}
        </strong>
      );
    }
    return part;
  });
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ initialPrompt }) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `### 🌟 Selamat Datang di Finora AI Assistant

Saya adalah asisten keuangan berbasis Google Gemini yang menganalisis **data transaksi riil** Anda secara aman.

**Fitur Analisis Finora AI:**
- Evaluasi pengeluaran bulan berjalan dan perbandingan dengan bulan lalu
- Deteksi kategori pengeluaran terbesar & potensi pemborosan
- Pemantauan batas anggaran bulanan (*budget tracking*)
- Ringkasan kesehatan arus kas (*cash flow*) dan strategi efisiensi biaya

Silakan pilih salah satu pertanyaan rekomendasi di bawah atau ajukan pertanyaan Anda sendiri!`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<string>('Google Gemini AI');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || loading) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiAskAi(q);
      if (res?.metadata?.model) {
        setActiveModel(res.metadata.model);
      }
      const assistantMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res?.reply || 'Maaf, tidak ada tanggapan yang dihasilkan.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: AIMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ Maaf, terjadi kendala saat memproses permintaan: ${
          err.message || 'Silakan periksa koneksi atau coba kembali.'
        }`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Obrolan telah dibersihkan. Silakan ajukan pertanyaan seputar laporan keuangan dan pembukuan Anda!`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 text-white shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold">Finora AI Financial Advisor</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Analisis keuangan cerdas berbasis Google Gemini tanpa rekayasa data.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleClearChat}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition text-xs flex items-center space-x-1"
            title="Bersihkan Percakapan"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Bersihkan</span>
          </button>
        </div>
      </div>

      {/* Preset Questions Accordion/Chips */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            💡 Pertanyaan Rekomendasi Cepat:
          </p>
          <span className="text-[10px] text-slate-400">Klik untuk langsung bertanya</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.label} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Icon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{group.label}</span>
                </div>
                <div className="space-y-1">
                  {group.prompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSend(p)}
                      disabled={loading}
                      className="w-full text-left text-[11px] p-1.5 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80 text-slate-700 transition disabled:opacity-50 truncate block"
                      title={p}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 min-h-[440px] max-h-[580px] overflow-y-auto space-y-4 flex flex-col">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-tr from-teal-600 to-emerald-600 text-white'
              }`}
            >
              {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`relative group max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-tl-none'
              }`}
            >
              {msg.sender === 'user' ? (
                <div className="text-xs sm:text-sm font-medium whitespace-pre-wrap">{msg.text}</div>
              ) : (
                <FormattedMessage text={msg.text} />
              )}

              <div
                className={`flex items-center justify-between mt-2 pt-1 border-t text-[10px] ${
                  msg.sender === 'user'
                    ? 'border-emerald-500/50 text-emerald-100'
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="hover:text-slate-700 flex items-center space-x-1"
                    title="Salin tanggapan"
                  >
                    {copiedId === msg.id ? (
                      <span className="text-emerald-600 flex items-center font-medium">
                        <Check className="w-3 h-3 mr-0.5" /> Tersalin
                      </span>
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs text-slate-600 flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Finora AI sedang menganalisis data keuangan Anda...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Tanyakan analisis keuangan (contoh: Berapa pengeluaran saya bulan ini?)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-xs transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
