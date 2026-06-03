import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// ── Helpers ────────────────────────────────────────────────────────────────────
function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

function sendToken(res: Response, userId: string): void {
  const token = generateToken(userId);
  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ── Email / Password Register ──────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body as {
      username: string; email: string; password: string;
    };

    if (!username || !email || !password) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters.' });
      return;
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      res.status(400).json({ message: 'Email already registered.' });
      return;
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      res.status(400).json({ message: 'Username already taken.' });
      return;
    }

    const user = await User.create({ username, email, password, provider: 'local' });
    const token = generateToken(user._id.toString());
    sendToken(res, user._id.toString());

    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

// ── Email / Password Login ─────────────────────────────────────────────────────
router.post('/login', (req: Request, res: Response, next): void => {
  passport.authenticate('local', { session: false }, (err: Error, user: any, info: any) => {
    if (err) { next(err); return; }
    if (!user) {
      res.status(401).json({ message: info?.message || 'Invalid credentials.' });
      return;
    }
    const token = generateToken(user._id.toString());
    sendToken(res, user._id.toString());
    res.json({ token, user: user.toJSON() });
  })(req, res, next);
});

// ── Google OAuth ───────────────────────────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: true }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: true, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed` }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    const token = generateToken(user._id.toString());
    res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${token}`);
  },
);

// ── Get Current User ───────────────────────────────────────────────────────────
router.get('/me', protect, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// ── Logout ─────────────────────────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

export default router;
