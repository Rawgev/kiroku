import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import Review from '@/models/Review';
import '@/models/User';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const reviews = await Review.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch reviews.' }, { status: 500 });
  }
}
