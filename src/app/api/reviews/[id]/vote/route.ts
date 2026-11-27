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
    const { direction } = (await req.json()) as { direction: 'up' | 'down' };

    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json({ message: 'Invalid vote direction.' }, { status: 400 });
    }

    if (!review.upvotes) review.upvotes = [];
    if (!review.downvotes) review.downvotes = [];

    const upIndex = review.upvotes.findIndex((uid: mongoose.Types.ObjectId) => uid.equals(userId));
    const downIndex = review.downvotes.findIndex((uid: mongoose.Types.ObjectId) => uid.equals(userId));

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
    return NextResponse.json({ review: populated });
  } catch (err) {
    console.error('Failed to vote review:', err);
    return NextResponse.json({ message: 'Failed to vote review.' }, { status: 500 });
  }
}
