import { Router, Response } from 'express';
import WatchParty from '../models/WatchParty';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/watchparty  — own lists ──────────────────────────────────────────
router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parties = await WatchParty.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    res.json({ parties });
  } catch {
    res.status(500).json({ message: 'Failed to fetch watch parties.' });
  }
});

// ── POST /api/watchparty  — create ───────────────────────────────────────────
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, season, isPublic } = req.body;
    const party = await WatchParty.create({
      userId: req.user!._id,
      name, season,
      items:    [],
      isPublic: isPublic || false,
    });
    res.status(201).json({ party });
  } catch {
    res.status(500).json({ message: 'Failed to create watch party.' });
  }
});

// ── PUT /api/watchparty/:id  — update name / season ──────────────────────────
router.put('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const party = await WatchParty.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!party) { res.status(404).json({ message: 'Watch party not found.' }); return; }

    const { name, season, isPublic } = req.body;
    if (name     !== undefined) party.name     = name;
    if (season   !== undefined) party.season   = season;
    if (isPublic !== undefined) party.isPublic = isPublic;

    await party.save();
    res.json({ party });
  } catch {
    res.status(500).json({ message: 'Failed to update watch party.' });
  }
});

// ── DELETE /api/watchparty/:id ────────────────────────────────────────────────
router.delete('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await WatchParty.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    res.json({ message: 'Watch party deleted.' });
  } catch {
    res.status(500).json({ message: 'Failed to delete watch party.' });
  }
});

// ── POST /api/watchparty/:id/items  — add an anime to the list ───────────────
router.post('/:id/items', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const party = await WatchParty.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!party) { res.status(404).json({ message: 'Watch party not found.' }); return; }

    const { mediaId, title, coverImage, totalEps, airingDay } = req.body;
    const alreadyIn = party.items.find((i) => i.mediaId === mediaId);
    if (alreadyIn) { res.status(400).json({ message: 'Already in this watch party.' }); return; }

    party.items.push({ mediaId, title, coverImage, mediaType: 'anime', currentEp: 0, totalEps, airingDay, completed: false } as any);
    await party.save();
    res.json({ party });
  } catch {
    res.status(500).json({ message: 'Failed to add item.' });
  }
});

// ── PUT /api/watchparty/:id/items/:itemId  — update episode progress ─────────
router.put('/:id/items/:itemId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const party = await WatchParty.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!party) { res.status(404).json({ message: 'Watch party not found.' }); return; }

    const item = party.items.find((i) => i._id.toString() === req.params.itemId);
    if (!item) { res.status(404).json({ message: 'Item not found.' }); return; }

    const { currentEp, completed } = req.body;
    if (currentEp !== undefined) item.currentEp = currentEp;
    if (completed !== undefined) item.completed  = completed;

    await party.save();
    res.json({ party });
  } catch {
    res.status(500).json({ message: 'Failed to update item.' });
  }
});

// ── DELETE /api/watchparty/:id/items/:itemId ──────────────────────────────────
router.delete('/:id/items/:itemId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const party = await WatchParty.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!party) { res.status(404).json({ message: 'Watch party not found.' }); return; }

    party.items = party.items.filter((i) => i._id.toString() !== req.params.itemId);
    await party.save();
    res.json({ party });
  } catch {
    res.status(500).json({ message: 'Failed to remove item.' });
  }
});

export default router;
