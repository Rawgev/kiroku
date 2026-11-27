import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Review from '@/models/Review';
import '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const mediaId = searchParams.get('mediaId');
    const mediaType = searchParams.get('mediaType');
    const userId = searchParams.get('userId');
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');

    const filter: Record<string, unknown> = {};
    if (mediaId) filter.mediaId = Number(mediaId);
    if (mediaType) filter.mediaType = mediaType;
    if (userId) filter.userId = userId;

    const skip = (page - 1) * limit;
    const total = await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (err) {
    console.error('Failed to fetch reviews:', err);
    return NextResponse.json(
      {
        message: 'Failed to fetch reviews.',
        error: process.env.NODE_ENV === 'production' ? undefined : (err as Error).message,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { mediaId, mediaType, mediaTitle, mediaCover, rating, title, body, spoiler } = await req.json();

    const exists = await Review.findOne({ userId: auth.user._id, mediaId, mediaType });
    if (exists) {
      return NextResponse.json({ message: 'You have already reviewed this title.' }, { status: 400 });
    }

    const review = await Review.create({
      userId: auth.user._id,
      mediaId,
      mediaType,
      mediaTitle,
      mediaCover,
      rating,
      title,
      body,
      spoiler: spoiler || false,
    });

    const populated = await review.populate('userId', 'username avatar');
    return NextResponse.json({ review: populated }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Failed to create review.' }, { status: 500 });
  }
}
