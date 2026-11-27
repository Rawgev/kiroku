import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import MediaEntry from '@/models/MediaEntry';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const sort = searchParams.get('sort') || 'updatedAt';

    const filter: Record<string, unknown> = { userId: auth.user._id };
    if (status) filter.status = status;
    if (type) filter.mediaType = type;

    const entries = await MediaEntry.find(filter)
      .sort({ [sort]: -1 })
      .lean();

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch library.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const {
      mediaId, mediaType, title, coverImage,
      status, score, progress, totalProgress,
      genres, notes, isFavorite,
    } = await req.json();

    const existing = await MediaEntry.findOne({ userId: auth.user._id, mediaId });
    if (existing) {
      return NextResponse.json({ message: 'This title is already in your library.' }, { status: 400 });
    }

    const calculatedProgress = status === 'completed' && totalProgress ? totalProgress : (progress || 0);

    const entry = await MediaEntry.create({
      userId: auth.user._id,
      mediaId,
      mediaType,
      title,
      coverImage,
      status,
      score: score || 0,
      progress: calculatedProgress,
      totalProgress,
      genres: genres || [],
      notes: notes || '',
      isFavorite: isFavorite || false,
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Failed to add to library.' }, { status: 500 });
  }
}
