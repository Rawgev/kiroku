import { Router, Request, Response } from 'express';
import User from '../models/User';
import MediaEntry from '../models/MediaEntry';
import Review from '../models/Review';
import { protect, AuthRequest } from '../middleware/auth';
import { adminOnly } from '../middleware/admin';

const router = Router();

// ── GET /api/users/profile  — own profile ─────────────────────────────────────
router.get('/profile', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('-password').lean();
    res.json({ user });
  } catch {
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

// ── PUT /api/users/profile  — update own profile ─────────────────────────────
router.put('/profile', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, bio, avatar } = req.body as { username?: string; bio?: string; avatar?: string };

    if (username) {
      const taken = await User.findOne({ username, _id: { $ne: req.user!._id } });
      if (taken) {
        res.status(400).json({ message: 'Username already taken.' });
        return;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: { ...(username && { username }), ...(bio !== undefined && { bio }), ...(avatar && { avatar }) } },
      { new: true, runValidators: true },
    ).select('-password');

    res.json({ user });
  } catch {
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// ── GET /api/users/:username  — public user profile ──────────────────────────
router.get('/:username', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password -email').lean();
    if (!user) { res.status(404).json({ message: 'User not found.' }); return; }

    const [entriesCount, reviewsCount, favoritesCount] = await Promise.all([
      MediaEntry.countDocuments({ userId: user._id }),
      Review.countDocuments({ userId: user._id }),
      MediaEntry.countDocuments({ userId: user._id, isFavorite: true }),
    ]);

    res.json({ user, stats: { entriesCount, reviewsCount, favoritesCount } });
  } catch {
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
});

// ── GET /api/users  — admin: list all users ───────────────────────────────────
router.get('/', protect, adminOnly, async (_req, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    const total = users.length;
    res.json({ users, total });
  } catch {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// ── DELETE /api/users/:id  — admin: delete user ───────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res: Response): Promise<void> => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await MediaEntry.deleteMany({ userId: req.params.id });
    await Review.deleteMany({ userId: req.params.id });
    res.json({ message: 'User and all their data deleted.' });
  } catch {
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

// ── PUT /api/users/:id/role  — admin: change role ────────────────────────────
router.put('/:id/role', protect, adminOnly, async (req, res: Response): Promise<void> => {
  try {
    const { role } = req.body as { role: 'user' | 'admin' };
    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role.' });
      return;
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json({ user });
  } catch {
    res.status(500).json({ message: 'Failed to update role.' });
  }
});

export default router;
