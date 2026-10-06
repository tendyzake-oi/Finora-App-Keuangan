# Panduan Deploy Finora ke Vercel via GitHub

Aplikasi Finora telah dikonfigurasi penuh agar dapat di-deploy dan dipublikasikan langsung ke **Vercel** melalui repository **GitHub** Anda.

---

## 🚀 Langkah-langkah Deploy ke Vercel

### 1. Push Kode ke Repository GitHub
Pastikan seluruh file proyek ini sudah Anda commit dan push ke repository GitHub milik Anda:

```bash
git add .
git commit -m "Konfigurasi Vercel deployment untuk Finora"
git push origin main
```

---

### 2. Hubungkan Repository ke Vercel
1. Buka [vercel.com](https://vercel.com/) dan login menggunakan akun GitHub Anda.
2. Di dashboard Vercel, klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Cari dan pilih repository GitHub **Finora** Anda, lalu klik **"Import"**.

---

### 3. Pengaturan Proyek di Vercel
Vercel akan otomatis membaca file konfigurasi `vercel.json` yang telah disediakan:

- **Framework Preset**: `Vite` (terdeteksi otomatis)
- **Root Directory**: `./`
- **Build Command**: `npm run build` (atau `vite build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

### 4. Tambahkan Environment Variables di Vercel
Pada bagian **"Environment Variables"** sebelum menekan tombol Deploy, tambahkan variabel berikut:

| Nama Variabel | Wajib / Opsional | Keterangan |
|---|---|---|
| `GEMINI_API_KEY` | **Wajib (untuk AI)** | API Key Google Gemini (dapatkan gratis di [aistudio.google.com](https://aistudio.google.com/)) |
| `JWT_SECRET` | Disarankan | Kunci enkripsi token login (contoh: `finora-jwt-secret-key-production-2026`) |
| `DB_HOST` | Opsional | Host database MySQL (jika menggunakan database cloud seperti TiDB / Aiven / PlanetScale) |
| `DB_PORT` | Opsional | Port MySQL (default: `3306`) |
| `DB_USER` | Opsional | Username database MySQL |
| `DB_PASSWORD` | Opsional | Password database MySQL |
| `DB_NAME` | Opsional | Nama database MySQL |

> 💡 **Catatan Database:** Jika Anda tidak mengisi variabel database MySQL, Finora akan otomatis menggunakan penyimpanan file relasional serverless di direktori `/tmp` dengan data demo bawaan (*Budi Santoso*).

---

### 5. Deploy & Selesai!
1. Klik tombol **"Deploy"**.
2. Vercel akan menjalankan build frontend Vite ke folder `dist` dan menyiapkan serverless function `/api` dari `api/index.ts`.
3. Setelah proses selesai (biasanya sekitar 1–2 menit), aplikasi Finora Anda akan langsung aktif di domain Vercel (contoh: `https://finora-xxx.vercel.app`).
4. Setiap kali Anda melakukan `git push` ke GitHub, Vercel akan otomatis melakukan auto-deploy pembaruan terbaru!
