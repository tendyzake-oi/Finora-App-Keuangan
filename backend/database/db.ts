import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  monthly_budget_limit: number;
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

interface DatabaseSchema {
  users: User[];
  transactions: Transaction[];
  lastUserId: number;
  lastTransactionId: number;
}

// In-memory cache for ultra-fast reads and serverless /tmp resilience
let memoryDb: DatabaseSchema | null = null;

function getDataFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'finora_data.json');
  }
  return path.resolve(process.cwd(), 'backend/database/finora_data.json');
}

// MySQL connection pool (if MySQL is running and configured)
let mysqlPool: mysql.Pool | null = null;
let useMySQL = false;

export async function initDatabase(): Promise<void> {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'finora_db';
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  try {
    const testPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000,
    });

    // Test ping
    const connection = await testPool.getConnection();
    await connection.ping();
    connection.release();

    mysqlPool = testPool;
    useMySQL = true;
    console.log('[Finora DB] Connected to MySQL database successfully.');

    // Ensure tables exist in MySQL
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description TEXT,
        transaction_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    return;
  } catch (err) {
    console.warn('[Finora DB] MySQL server not reachable or not configured. Falling back to persistent file-based SQL store.');
    useMySQL = false;
  }

  // Ensure JSON database exists
  ensureFileDatabase();
}

function ensureFileDatabase(): void {
  const filePath = getDataFilePath();
  const dir = path.dirname(filePath);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    // If directory creation fails (e.g. read-only), continue safely
  }

  // If already loaded in memory, nothing to do
  if (memoryDb) return;

  // Check if file exists at target path
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      memoryDb = JSON.parse(raw);
      return;
    } catch (e) {
      console.warn('[Finora DB] Failed reading existing data file:', e);
    }
  }

  // Check if original bundled file exists
  const bundledPath = path.resolve(process.cwd(), 'backend/database/finora_data.json');
  if (fs.existsSync(bundledPath)) {
    try {
      const raw = fs.readFileSync(bundledPath, 'utf-8');
      memoryDb = JSON.parse(raw);
      // Try copying to writable target
      try {
        fs.writeFileSync(filePath, raw, 'utf-8');
      } catch (e) {}
      return;
    } catch (e) {}
  }

  // Default seed database
  const salt = bcrypt.genSaltSync(10);
  const demoPasswordHash = bcrypt.hashSync('password123', salt);
  const now = new Date().toISOString();

  const initialData: DatabaseSchema = {
    users: [
      {
        id: 1,
        name: 'Budi Santoso',
        email: 'budi@finora.id',
        password_hash: demoPasswordHash,
        monthly_budget_limit: 5000000,
        created_at: now,
      },
    ],
    transactions: [
      {
        id: 1,
        user_id: 1,
        type: 'income',
        category: 'Penjualan Produk',
        amount: 15500000,
        description: 'Penjualan batch pertama kue kering lebaran',
        transaction_date: '2026-09-02',
        created_at: '2026-09-02T10:00:00.000Z',
      },
      {
        id: 2,
        user_id: 1,
        type: 'expense',
        category: 'Bahan Baku',
        amount: 4200000,
        description: 'Pembelian tepung, mentega, dan coklat premium',
        transaction_date: '2026-09-05',
        created_at: '2026-09-05T14:30:00.000Z',
      },
      {
        id: 3,
        user_id: 1,
        type: 'expense',
        category: 'Operasional & Utilitas',
        amount: 1250000,
        description: 'Listrik, air galon, dan gas oven',
        transaction_date: '2026-09-10',
        created_at: '2026-09-10T09:00:00.000Z',
      },
      {
        id: 4,
        user_id: 1,
        type: 'income',
        category: 'Penjualan Produk',
        amount: 8750000,
        description: 'Pesanan snack box catering kantor dinas',
        transaction_date: '2026-09-18',
        created_at: '2026-09-18T16:00:00.000Z',
      },
      {
        id: 5,
        user_id: 1,
        type: 'expense',
        category: 'Gaji Karyawan',
        amount: 5000000,
        description: 'Gaji 2 orang asisten produksi bulan September',
        transaction_date: '2026-09-28',
        created_at: '2026-09-28T18:00:00.000Z',
      },
      {
        id: 6,
        user_id: 1,
        type: 'income',
        category: 'Penjualan Produk',
        amount: 18200000,
        description: 'Pesanan kue tart & hampers bulan Oktober',
        transaction_date: '2026-10-01',
        created_at: '2026-10-01T11:00:00.000Z',
      },
      {
        id: 7,
        user_id: 1,
        type: 'expense',
        category: 'Bahan Baku',
        amount: 4800000,
        description: 'Stok mentega Wijsman dan keju edam',
        transaction_date: '2026-10-02',
        created_at: '2026-10-02T13:15:00.000Z',
      },
      {
        id: 8,
        user_id: 1,
        type: 'expense',
        category: 'Pemasaran & Iklan',
        amount: 750000,
        description: 'Iklan Instagram Ads & TikTok Shop Promo',
        transaction_date: '2026-10-03',
        created_at: '2026-10-03T08:45:00.000Z',
      },
    ],
    lastUserId: 1,
    lastTransactionId: 8,
  };

  memoryDb = initialData;
  try {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (e) {
    // Read-only filesystem fallback
  }
}

function readData(): DatabaseSchema {
  if (memoryDb) return memoryDb;
  ensureFileDatabase();
  return memoryDb!;
}

function writeData(data: DatabaseSchema): void {
  memoryDb = data;
  try {
    const filePath = getDataFilePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Finora DB] Disk write failed (running in read-only environment), maintained in memory:', err);
  }
}

// ================= USER OPERATIONS =================

export async function findUserByEmail(email: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>(
      'SELECT id, name, email, password_hash, monthly_budget_limit, created_at FROM users WHERE LOWER(email) = ? LIMIT 1',
      [cleanEmail]
    );
    if (rows.length > 0) {
      const r = rows[0];
      return {
        id: Number(r.id),
        name: String(r.name),
        email: String(r.email),
        password_hash: String(r.password_hash),
        monthly_budget_limit: Number(r.monthly_budget_limit ?? 5000000),
        created_at: String(r.created_at),
      };
    }
    return null;
  }

  const db = readData();
  const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) return null;
  return {
    ...user,
    monthly_budget_limit: Number(user.monthly_budget_limit ?? 5000000),
  };
}

export async function findUserById(id: number): Promise<User | null> {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>(
      'SELECT id, name, email, password_hash, monthly_budget_limit, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length > 0) {
      const r = rows[0];
      return {
        id: Number(r.id),
        name: String(r.name),
        email: String(r.email),
        password_hash: String(r.password_hash),
        monthly_budget_limit: Number(r.monthly_budget_limit ?? 5000000),
        created_at: String(r.created_at),
      };
    }
    return null;
  }

  const db = readData();
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;
  return {
    ...user,
    monthly_budget_limit: Number(user.monthly_budget_limit ?? 5000000),
  };
}

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
  monthlyBudgetLimit: number = 5000000
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const limit = Math.max(0, Number(monthlyBudgetLimit) || 5000000);
  if (useMySQL && mysqlPool) {
    const [result] = await mysqlPool.execute<mysql.ResultSetHeader>(
      'INSERT INTO users (name, email, password_hash, monthly_budget_limit) VALUES (?, ?, ?, ?)',
      [name.trim(), cleanEmail, passwordHash, limit]
    );
    const id = result.insertId;
    const user = await findUserById(id);
    if (!user) throw new Error('Failed to retrieve created user');
    return user;
  }

  const db = readData();
  const newId = (db.lastUserId || db.users.length) + 1;
  const newUser: User = {
    id: newId,
    name: name.trim(),
    email: cleanEmail,
    password_hash: passwordHash,
    monthly_budget_limit: limit,
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.lastUserId = newId;
  writeData(db);
  return newUser;
}

export async function updateUserBudgetLimit(userId: number, limit: number): Promise<boolean> {
  const cleanLimit = Math.max(0, Number(limit));
  if (useMySQL && mysqlPool) {
    const [result] = await mysqlPool.execute<mysql.ResultSetHeader>(
      'UPDATE users SET monthly_budget_limit = ? WHERE id = ?',
      [cleanLimit, userId]
    );
    return result.affectedRows > 0;
  }

  const db = readData();
  const index = db.users.findIndex((u) => u.id === userId);
  if (index === -1) return false;
  db.users[index].monthly_budget_limit = cleanLimit;
  writeData(db);
  return true;
}

export async function updateUserPassword(userId: number, newPasswordHash: string): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    const [result] = await mysqlPool.execute<mysql.ResultSetHeader>(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, userId]
    );
    return result.affectedRows > 0;
  }

  const db = readData();
  const index = db.users.findIndex((u) => u.id === userId);
  if (index === -1) return false;
  db.users[index].password_hash = newPasswordHash;
  writeData(db);
  return true;
}

export async function deleteUserAccount(userId: number): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    const [result] = await mysqlPool.execute<mysql.ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  }

  const db = readData();
  const initialCount = db.users.length;
  db.users = db.users.filter((u) => u.id !== userId);
  db.transactions = db.transactions.filter((t) => t.user_id !== userId);
  writeData(db);
  return db.users.length < initialCount;
}

// ================= TRANSACTION OPERATIONS =================

export async function getTransactionsByUserId(
  userId: number,
  options?: {
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }
): Promise<Transaction[]> {
  if (useMySQL && mysqlPool) {
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (options?.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }
    if (options?.category) {
      query += ' AND category = ?';
      params.push(options.category);
    }
    if (options?.startDate) {
      query += ' AND transaction_date >= ?';
      params.push(options.startDate);
    }
    if (options?.endDate) {
      query += ' AND transaction_date <= ?';
      params.push(options.endDate);
    }
    if (options?.search) {
      query += ' AND (description LIKE ? OR category LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    query += ' ORDER BY transaction_date DESC, id DESC';
    const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>(query, params);
    return rows.map((r) => ({
      id: Number(r.id),
      user_id: Number(r.user_id),
      type: r.type as 'income' | 'expense',
      category: String(r.category),
      amount: Number(r.amount),
      description: String(r.description || ''),
      transaction_date: String(r.transaction_date).substring(0, 10),
      created_at: String(r.created_at),
    }));
  }

  const db = readData();
  let list = db.transactions.filter((t) => t.user_id === userId);

  if (options?.type) {
    list = list.filter((t) => t.type === options.type);
  }
  if (options?.category && options.category !== 'all') {
    list = list.filter((t) => t.category.toLowerCase() === options.category!.toLowerCase());
  }
  if (options?.startDate) {
    list = list.filter((t) => t.transaction_date >= options.startDate!);
  }
  if (options?.endDate) {
    list = list.filter((t) => t.transaction_date <= options.endDate!);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      (t) => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    );
  }

  // Sort descending by date, then id
  return list.sort((a, b) => {
    if (b.transaction_date !== a.transaction_date) {
      return b.transaction_date.localeCompare(a.transaction_date);
    }
    return b.id - a.id;
  });
}

export async function findTransactionById(
  id: number,
  userId: number
): Promise<Transaction | null> {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ? LIMIT 1',
      [id, userId]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: Number(r.id),
      user_id: Number(r.user_id),
      type: r.type as 'income' | 'expense',
      category: String(r.category),
      amount: Number(r.amount),
      description: String(r.description || ''),
      transaction_date: String(r.transaction_date).substring(0, 10),
      created_at: String(r.created_at),
    };
  }

  const db = readData();
  const tx = db.transactions.find((t) => t.id === id && t.user_id === userId);
  return tx ? { ...tx } : null;
}

export async function createTransaction(
  userId: number,
  data: {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string;
    transaction_date: string;
  }
): Promise<Transaction> {
  if (useMySQL && mysqlPool) {
    const [result] = await mysqlPool.execute<mysql.ResultSetHeader>(
      'INSERT INTO transactions (user_id, type, category, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?)',
      [
        userId,
        data.type,
        data.category.trim(),
        data.amount,
        data.description.trim(),
        data.transaction_date,
      ]
    );
    const newTx = await findTransactionById(result.insertId, userId);
    if (!newTx) throw new Error('Failed to retrieve created transaction');
    return newTx;
  }

  const db = readData();
  const newId = (db.lastTransactionId || db.transactions.length) + 1;
  const newTx: Transaction = {
    id: newId,
    user_id: userId,
    type: data.type,
    category: data.category.trim(),
    amount: data.amount,
    description: data.description.trim(),
    transaction_date: data.transaction_date,
    created_at: new Date().toISOString(),
  };

  db.transactions.push(newTx);
  db.lastTransactionId = newId;
  writeData(db);
  return newTx;
}

export async function updateTransaction(
  id: number,
  userId: number,
  data: {
    type?: 'income' | 'expense';
    category?: string;
    amount?: number;
    description?: string;
    transaction_date?: string;
  }
): Promise<Transaction | null> {
  const existing = await findTransactionById(id, userId);
  if (!existing) return null;

  if (useMySQL && mysqlPool) {
    const updated = {
      type: data.type ?? existing.type,
      category: data.category ? data.category.trim() : existing.category,
      amount: data.amount ?? existing.amount,
      description: data.description !== undefined ? data.description.trim() : existing.description,
      transaction_date: data.transaction_date ?? existing.transaction_date,
    };

    await mysqlPool.execute(
      'UPDATE transactions SET type = ?, category = ?, amount = ?, description = ?, transaction_date = ? WHERE id = ? AND user_id = ?',
      [
        updated.type,
        updated.category,
        updated.amount,
        updated.description,
        updated.transaction_date,
        id,
        userId,
      ]
    );

    return findTransactionById(id, userId);
  }

  const db = readData();
  const index = db.transactions.findIndex((t) => t.id === id && t.user_id === userId);
  if (index === -1) return null;

  const current = db.transactions[index];
  db.transactions[index] = {
    ...current,
    type: data.type ?? current.type,
    category: data.category ? data.category.trim() : current.category,
    amount: data.amount !== undefined ? data.amount : current.amount,
    description: data.description !== undefined ? data.description.trim() : current.description,
    transaction_date: data.transaction_date ?? current.transaction_date,
  };

  writeData(db);
  return db.transactions[index];
}

export async function deleteTransaction(id: number, userId: number): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    const [result] = await mysqlPool.execute<mysql.ResultSetHeader>(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  const db = readData();
  const initialLength = db.transactions.length;
  db.transactions = db.transactions.filter((t) => !(t.id === id && t.user_id === userId));
  writeData(db);
  return db.transactions.length < initialLength;
}

export function isUsingMySQL(): boolean {
  return useMySQL;
}
