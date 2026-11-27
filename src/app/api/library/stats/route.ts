import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import MediaEntry from '@/models/MediaEntry';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const userId = auth.user._id;

    const [statusAgg, typeAgg, scoreAgg, genreAgg] = await Promise.all([
      MediaEntry.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      MediaEntry.aggregate([
        { $match: { userId } },
        { $group: { _id: '$mediaType', count: { $sum: 1 } } },
      ]),
      MediaEntry.aggregate([
        { $match: { userId, score: { $gt: 0 } } },
        { $group: { _id: '$score', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      MediaEntry.aggregate([
        { $match: { userId } },
        { $unwind: '$genres' },
        { $group: { _id: '$genres', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const completed = await MediaEntry.find({
      userId,
      status: { $in: ['completed', 'watching', 'reading'] },
    }).lean();

    const animeEntries = completed.filter((e) => e.mediaType === 'anime');
    const mangaEntries = completed.filter((e) => e.mediaType !== 'anime');
    const episodesWatched = animeEntries.reduce((sum, e) => sum + (e.progress || 0), 0);
    const chaptersRead = mangaEntries.reduce((sum, e) => sum + (e.progress || 0), 0);
    const hoursWatched = Math.round((episodesWatched * 24) / 60);

    const scoredEntries = completed.filter((e) => e.score > 0);
    const avgScore = scoredEntries.length
      ? +(scoredEntries.reduce((s, e) => s + e.score, 0) / scoredEntries.length).toFixed(1)
      : 0;

    return NextResponse.json({
      animeWatched: animeEntries.length,
      mangaRead: mangaEntries.length,
      episodesWatched,
      chaptersRead,
      hoursWatched,
      avgScore,
      statusDistribution: Object.fromEntries(statusAgg.map((x) => [x._id, x.count])),
      typeDistribution: Object.fromEntries(typeAgg.map((x) => [x._id, x.count])),
      scoreDistribution: Object.fromEntries(scoreAgg.map((x) => [x._id, x.count])),
      genreDistribution: Object.fromEntries(genreAgg.map((x) => [x._id, x.count])),
    });
  } catch {
    return NextResponse.json({ message: 'Failed to compute stats.' }, { status: 500 });
  }
}
