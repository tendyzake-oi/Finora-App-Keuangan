import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import budgetRoutes from './routes/budgetRoutes';
import aiRoutes from './routes/aiRoutes';
import { initDatabase, isUsingMySQL } from './database/db';

dotenv.config();

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Enable CORS and handle preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Idempotent DB initialization
let dbInitialized = false;
export async function ensureDb(): Promise<void> {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// Middleware to ensure database is ready
app.use(async (_req, _res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error('[Finora DB Init Error]:', err);
    next(err);
  }
});

// Health check endpoint (accessible via /api/health and /health)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    app: 'Finora - Smart Financial Management',
    platform: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js Express',
    database: isUsingMySQL() ? 'MySQL Server' : 'Persistent Relational Store (MySQL Compatible)',
    timestamp: new Date().toISOString(),
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Mount API routes with dual prefixes for full compatibility with Vercel rewrites & standard servers
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/transactions', transactionRoutes);
app.use('/transactions', transactionRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

app.use('/api/budget', budgetRoutes);
app.use('/budget', budgetRoutes);

app.use('/api/ai', aiRoutes);
app.use('/ai', aiRoutes);

// Global Error Handler for API
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Finora API Error]:', err);
  res.status(500).json({
    success: false,
    message: err?.message || 'Terjadi kesalahan internal pada server.',
  });
});

export default app;
