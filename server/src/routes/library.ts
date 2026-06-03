import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { protect, AuthRequest } from '../middleware/auth';
import MediaEntry, { WatchStatus } from '../models/MediaEntry';

const router = Router();

// ── GET /api/library  — own full library ──────────────────────────────────────
router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type, sort = 'updatedAt' } = req.query as {
      status?: WatchStatus; type?: string; sort?: string;
    };

    const filter: Record<string, unknown> = { userId: req.user!._id };
    if (status) filter.status = status;
    if (type)   filter.mediaType = type;

    const entries = await MediaEntry
      .find(filter)
      .sort({ [sort as string]: -1 })
      .lean();

    res.json({ entries });
  } catch {
    res.status(500).json({ message: 'Failed to fetch library.' });
  }
});

// ── GET /api/library/stats  — aggregated stats for current user ───────────────
router.get('/stats', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const [statusAgg, typeAgg, scoreAgg, genreAgg] = await Promise.all([
      // Status distribution
      MediaEntry.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Type distribution
      MediaEntry.aggregate([
        { $match: { userId } },
        { $group: { _id: '$mediaType', count: { $sum: 1 } } },
      ]),

      // Score distribution (only scored entries)
      MediaEntry.aggregate([
        { $match: { userId, score: { $gt: 0 } } },
        { $group: { _id: '$score', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Genre distribution
      MediaEntry.aggregate([
        { $match: { userId } },
        { $unwind: '$genres' },
        { $group: { _id: '$genres', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Compute totals
    const completed = await MediaEntry.find({
      userId, status: { $in: ['completed', 'watching', 'reading'] },
    }).lean();

    const animeEntries   = completed.filter((e) => e.mediaType === 'anime');
    const mangaEntries   = completed.filter((e) => e.mediaType !== 'anime');
    const episodesWatched = animeEntries.reduce((sum, e) => sum + (e.progress || 0), 0);
    const chaptersRead    = mangaEntries.reduce((sum, e) => sum + (e.progress || 0), 0);
    const hoursWatched    = Math.round((episodesWatched * 24) / 60);

    const scoredEntries = completed.filter((e) => e.score > 0);
    const avgScore = scoredEntries.length
      ? +(scoredEntries.reduce((s, e) => s + e.score, 0) / scoredEntries.length).toFixed(1)
      : 0;

    res.json({
      animeWatched:   animeEntries.length,
      mangaRead:      mangaEntries.length,
      episodesWatched,
      chaptersRead,
      hoursWatched,
      avgScore,
      statusDistribution:  Object.fromEntries(statusAgg.map((x) => [x._id, x.count])),
      typeDistribution:    Object.fromEntries(typeAgg.map((x)  => [x._id, x.count])),
      scoreDistribution:   Object.fromEntries(scoreAgg.map((x) => [x._id, x.count])),
      genreDistribution:   Object.fromEntries(genreAgg.map((x) => [x._id, x.count])),
    });
  } catch {
    res.status(500).json({ message: 'Failed to compute stats.' });
  }
});

// ── GET /api/library/user/:userId  — public library of another user ───────────
router.get('/user/:userId', async (req, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query as { status?: string; type?: string };

    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      res.status(400).json({ message: 'Invalid user ID.' });
      return;
    }

    const filter: Record<string, unknown> = { userId: req.params.userId };
    if (status) filter.status = status;
    if (type)   filter.mediaType = type;

    const entries = await MediaEntry.find(filter).sort({ updatedAt: -1 }).lean();
    res.json({ entries });
  } catch {
    res.status(500).json({ message: 'Failed to fetch library.' });
  }
});

// ── POST /api/library  — add entry ───────────────────────────────────────────
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      mediaId, mediaType, title, coverImage,
      status, score, progress, totalProgress,
      genres, notes, isFavorite,
    } = req.body;

    const existing = await MediaEntry.findOne({ userId: req.user!._id, mediaId });
    if (existing) {
      res.status(400).json({ message: 'This title is already in your library.' });
      return;
    }

    const calculatedProgress = status === 'completed' && totalProgress ? totalProgress : (progress || 0);

    const entry = await MediaEntry.create({
      userId: req.user!._id,
      mediaId, mediaType, title, coverImage,
      status, score: score || 0,
      progress: calculatedProgress,
      totalProgress, genres: genres || [],
      notes: notes || '', isFavorite: isFavorite || false,
    });

    res.status(201).json({ entry });
  } catch {
    res.status(500).json({ message: 'Failed to add to library.' });
  }
});

// ── PUT /api/library/:id  — update entry ─────────────────────────────────────
router.put('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await MediaEntry.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!entry) {
      res.status(404).json({ message: 'Entry not found.' });
      return;
    }

    const allowed = ['status', 'score', 'progress', 'totalProgress', 'notes', 'isFavorite', 'startDate', 'finishDate', 'rewatches'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        (entry as any)[field] = req.body[field];
      }
    });

    if (entry.status === 'completed' && entry.totalProgress) {
      entry.progress = entry.totalProgress;
    }

    await entry.save();
    res.json({ entry });
  } catch {
    res.status(500).json({ message: 'Failed to update entry.' });
  }
});

// ── DELETE /api/library/:id  — remove entry ───────────────────────────────────
router.delete('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await MediaEntry.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!entry) {
      res.status(404).json({ message: 'Entry not found.' });
      return;
    }
    res.json({ message: 'Entry removed.' });
  } catch {
    res.status(500).json({ message: 'Failed to remove entry.' });
  }
});

export default router;
