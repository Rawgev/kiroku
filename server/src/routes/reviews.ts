import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import { protect, AuthRequest } from '../middleware/auth';
import { adminOnly } from '../middleware/admin';

const router = Router();

// ── GET /api/reviews  — list (filterable) ─────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaId, mediaType, userId, page = '1', limit = '10' } = req.query as {
      mediaId?: string; mediaType?: string; userId?: string; page?: string; limit?: string;
    };

    const filter: Record<string, unknown> = {};
    if (mediaId)   filter.mediaId   = Number(mediaId);
    if (mediaType) filter.mediaType = mediaType;
    if (userId)    filter.userId    = userId;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments(filter);

    const reviews = await Review
      .find(filter)
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      reviews,
      pagination: {
        total,
        page:      Number(page),
        pages:     Math.ceil(total / Number(limit)),
        hasMore:   skip + Number(limit) < total,
      },
    });
  } catch (err) {
    console.error('Failed to fetch reviews:', err);
    res.status(500).json({
      message: 'Failed to fetch reviews.',
      error: process.env.NODE_ENV === 'production' ? undefined : (err as Error).message,
    });
  }
});

// ── GET /api/reviews/admin/all  — admin: all reviews ─────────────────────────
// ⚠️  MUST be registered BEFORE GET /:id
// Express matches routes top-to-bottom. If /:id came first,
// the string "admin" would be captured as the :id param and
// Mongoose would throw a CastError trying to cast "admin" to ObjectId.
router.get('/admin/all', protect, adminOnly, async (_req, res: Response): Promise<void> => {
  try {
    const reviews = await Review
      .find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ reviews });
  } catch {
    res.status(500).json({ message: 'Failed to fetch reviews.' });
  }
});

// ── GET /api/reviews/:id ──────────────────────────────────────────────────────
// ⚠️  Must come AFTER any fixed-string routes like /admin/all
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id).populate('userId', 'username avatar').lean();
    if (!review) { res.status(404).json({ message: 'Review not found.' }); return; }
    res.json({ review });
  } catch {
    res.status(500).json({ message: 'Failed to fetch review.' });
  }
});

// ── POST /api/reviews  — create ───────────────────────────────────────────────
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mediaId, mediaType, mediaTitle, mediaCover, rating, title, body, spoiler } = req.body;

    // One review per media per user
    const exists = await Review.findOne({ userId: req.user!._id, mediaId, mediaType });
    if (exists) {
      res.status(400).json({ message: 'You have already reviewed this title.' });
      return;
    }

    const review = await Review.create({
      userId: req.user!._id,
      mediaId, mediaType, mediaTitle, mediaCover,
      rating, title, body,
      spoiler: spoiler || false,
    });

    const populated = await review.populate('userId', 'username avatar');
    res.status(201).json({ review: populated });
  } catch {
    res.status(500).json({ message: 'Failed to create review.' });
  }
});

// ── PUT /api/reviews/:id  — update (own only) ────────────────────────────────
router.put('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) { res.status(404).json({ message: 'Review not found.' }); return; }
    if (review.userId.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Not authorized to edit this review.' });
      return;
    }

    const allowed = ['rating', 'title', 'body', 'spoiler'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) (review as any)[f] = req.body[f]; });
    await review.save();

    const populated = await review.populate('userId', 'username avatar');
    res.json({ review: populated });
  } catch {
    res.status(500).json({ message: 'Failed to update review.' });
  }
});

// ── DELETE /api/reviews/:id  — own or admin ───────────────────────────────────
router.delete('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) { res.status(404).json({ message: 'Review not found.' }); return; }

    const isOwner = review.userId.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Not authorized.' });
      return;
    }

    await review.deleteOne();
    res.json({ message: 'Review deleted.' });
  } catch {
    res.status(500).json({ message: 'Failed to delete review.' });
  }
});

// ── POST /api/reviews/:id/vote  — Reddit-style voting ─────────────────────────
router.post('/:id/vote', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) { res.status(404).json({ message: 'Review not found.' }); return; }

    const userId = req.user!._id as mongoose.Types.ObjectId;
    const { direction } = req.body as { direction: 'up' | 'down' };

    if (direction !== 'up' && direction !== 'down') {
      res.status(400).json({ message: 'Invalid vote direction.' });
      return;
    }

    if (!review.upvotes) review.upvotes = [];
    if (!review.downvotes) review.downvotes = [];

    const upIndex = review.upvotes.findIndex((id) => id.equals(userId));
    const downIndex = review.downvotes.findIndex((id) => id.equals(userId));

    if (direction === 'up') {
      if (upIndex > -1) {
        review.upvotes.splice(upIndex, 1);
      } else {
        review.upvotes.push(userId);
        if (downIndex > -1) review.downvotes.splice(downIndex, 1);
      }
    } else {
      if (downIndex > -1) {
        review.downvotes.splice(downIndex, 1);
      } else {
        review.downvotes.push(userId);
        if (upIndex > -1) review.upvotes.splice(upIndex, 1);
      }
    }

    review.score = review.upvotes.length - review.downvotes.length;
    review.likes = review.upvotes;
    review.likesCount = review.upvotes.length;

    await review.save();
    const populated = await review.populate('userId', 'username avatar');
    res.json({ review: populated });
  } catch (err) {
    console.error('Failed to vote review:', err);
    res.status(500).json({ message: 'Failed to vote review.' });
  }
});

// ── POST /api/reviews/:id/react  — Emoji reaction count increment ─────────────
router.post('/:id/react', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) { res.status(404).json({ message: 'Review not found.' }); return; }

    const userId = req.user!._id as mongoose.Types.ObjectId;
    const { emoji } = req.body as { emoji: 'heart' | 'fire' | 'zany' };

    let field: 'reactionHeart' | 'reactionFire' | 'reactionZany';
    if (emoji === 'heart') field = 'reactionHeart';
    else if (emoji === 'fire') field = 'reactionFire';
    else if (emoji === 'zany') field = 'reactionZany';
    else {
      res.status(400).json({ message: 'Invalid emoji reaction.' });
      return;
    }

    if (!review[field]) review[field] = [];

    const index = review[field].findIndex((id) => id.equals(userId));
    if (index > -1) {
      review[field].splice(index, 1);
    } else {
      review[field].push(userId);
    }

    await review.save();
    const populated = await review.populate('userId', 'username avatar');
    res.json({ review: populated });
  } catch (err) {
    console.error('Failed to react to review:', err);
    res.status(500).json({ message: 'Failed to react to review.' });
  }
});

// ── POST /api/reviews/:id/like  — legacy support ──────────────────────────────
router.post('/:id/like', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) { res.status(404).json({ message: 'Review not found.' }); return; }

    const userId = req.user!._id as mongoose.Types.ObjectId;
    if (!review.upvotes) review.upvotes = [];
    const idx = review.upvotes.findIndex((id) => id.equals(userId));

    if (idx === -1) {
      review.upvotes.push(userId);
      const downIdx = review.downvotes ? review.downvotes.findIndex((id) => id.equals(userId)) : -1;
      if (downIdx > -1) review.downvotes.splice(downIdx, 1);
    } else {
      review.upvotes.splice(idx, 1);
    }

    review.score = review.upvotes.length - (review.downvotes ? review.downvotes.length : 0);
    review.likes = review.upvotes;
    review.likesCount = review.upvotes.length;

    await review.save();
    res.json({ liked: idx === -1, likesCount: review.likesCount });
  } catch {
    res.status(500).json({ message: 'Failed to toggle like.' });
  }
});

// ── Note: GET /admin/all is registered at the TOP of this file ────────────────
// It was moved before GET /:id to prevent Express from matching "admin" as an :id param.

export default router;
