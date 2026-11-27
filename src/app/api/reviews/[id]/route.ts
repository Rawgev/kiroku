import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Review from '@/models/Review';
import '@/models/User';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectDB();
    const review = await Review.findById(id).populate('userId', 'username avatar').lean();
    if (!review) {
      return NextResponse.json({ message: 'Review not found.' }, { status: 404 });
    }
    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch review.' }, { status: 500 });
  }
}

export async function PUT(
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
    if (review.userId.toString() !== auth.user._id.toString()) {
      return NextResponse.json({ message: 'Not authorized to edit this review.' }, { status: 403 });
    }

    const body = await req.json();
    const allowed = ['rating', 'title', 'body', 'spoiler'];
    allowed.forEach((f) => {
      if (body[f] !== undefined) (review as Record<string, unknown>)[f] = body[f];
    });
    await review.save();

    const populated = await review.populate('userId', 'username avatar');
    return NextResponse.json({ review: populated });
  } catch {
    return NextResponse.json({ message: 'Failed to update review.' }, { status: 500 });
  }
}

export async function DELETE(
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

    const isOwner = review.userId.toString() === auth.user._id.toString();
    const isAdmin = auth.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Not authorized.' }, { status: 403 });
    }

    await review.deleteOne();
    return NextResponse.json({ message: 'Review deleted.' });
  } catch {
    return NextResponse.json({ message: 'Failed to delete review.' }, { status: 500 });
  }
}
