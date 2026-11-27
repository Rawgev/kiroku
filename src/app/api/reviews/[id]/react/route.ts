import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Review from '@/models/Review';
import '@/models/User';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    await connectDB();
    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ message: 'Review not found.' }, { status: 404 });
    }

    const userId = auth.user._id as mongoose.Types.ObjectId;
    const { emoji } = (await req.json()) as { emoji: 'heart' | 'fire' | 'zany' };

    let field: 'reactionHeart' | 'reactionFire' | 'reactionZany';
    if (emoji === 'heart') field = 'reactionHeart';
    else if (emoji === 'fire') field = 'reactionFire';
    else if (emoji === 'zany') field = 'reactionZany';
    else {
      return NextResponse.json({ message: 'Invalid emoji reaction.' }, { status: 400 });
    }

    if (!review[field]) review[field] = [];

    const index = review[field].findIndex((uid: mongoose.Types.ObjectId) => uid.equals(userId));
    if (index > -1) {
      review[field].splice(index, 1);
    } else {
      review[field].push(userId);
    }

    await review.save();
    const populated = await review.populate('userId', 'username avatar');
    return NextResponse.json({ review: populated });
  } catch (err) {
    console.error('Failed to react to review:', err);
    return NextResponse.json({ message: 'Failed to react to review.' }, { status: 500 });
  }
}
