import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Review from '@/models/Review';

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
    if (!review.upvotes) review.upvotes = [];
    const idx = review.upvotes.findIndex((uid: mongoose.Types.ObjectId) => uid.equals(userId));

    if (idx === -1) {
      review.upvotes.push(userId);
      const downIdx = review.downvotes
        ? review.downvotes.findIndex((uid: mongoose.Types.ObjectId) => uid.equals(userId))
        : -1;
      if (downIdx > -1) review.downvotes.splice(downIdx, 1);
    } else {
      review.upvotes.splice(idx, 1);
    }

    review.score = review.upvotes.length - (review.downvotes ? review.downvotes.length : 0);
    review.likes = review.upvotes;
    review.likesCount = review.upvotes.length;

    await review.save();
    return NextResponse.json({ liked: idx === -1, likesCount: review.likesCount });
  } catch {
    return NextResponse.json({ message: 'Failed to toggle like.' }, { status: 500 });
  }
}
