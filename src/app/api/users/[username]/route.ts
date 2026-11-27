import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import User from '@/models/User';
import MediaEntry from '@/models/MediaEntry';
import Review from '@/models/Review';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    await connectDB();
    const user = await User.findOne({ username }).select('-password -email').lean<{ _id: unknown } | null>();
    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const [entriesCount, reviewsCount, favoritesCount] = await Promise.all([
      MediaEntry.countDocuments({ userId: user._id }),
      Review.countDocuments({ userId: user._id }),
      MediaEntry.countDocuments({ userId: user._id, isFavorite: true }),
    ]);

    return NextResponse.json({ user, stats: { entriesCount, reviewsCount, favoritesCount } });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch user.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { username: id } = await params;
    await connectDB();
    await User.findByIdAndDelete(id);
    await MediaEntry.deleteMany({ userId: id });
    await Review.deleteMany({ userId: id });
    return NextResponse.json({ message: 'User and all their data deleted.' });
  } catch {
    return NextResponse.json({ message: 'Failed to delete user.' }, { status: 500 });
  }
}
