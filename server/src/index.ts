import dns from 'node:dns';
dns.setServers(['1.1.1.1', '1.0.0.1']);
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db';
import passport from './config/passport';
import authRoutes from './routes/auth';
import libraryRoutes from './routes/library';
import reviewsRoutes from './routes/reviews';
import userRoutes from './routes/user';
import watchPartyRoutes from './routes/watchparty';

const app = express();

// ── Database ───────────────────────────────────────────────
connectDB();

// ── Security headers ───────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate limiting ──────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Body / cookies ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Session (only needed for OAuth dance) ─────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_session_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/Kiroku',
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// ── Passport ───────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/watchparty', watchPartyRoutes);

// Base root route to verify the API is running
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '🚀 Kiroku API is up and running smoothly!',
    env: process.env.NODE_ENV
  });
});

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── 404 ────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ── Global error handler ───────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// ── Start ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, () => {
  console.log(`\n🚀  Kiroku API  →  http://localhost:${PORT}`);
  console.log(`🌐  Env: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
