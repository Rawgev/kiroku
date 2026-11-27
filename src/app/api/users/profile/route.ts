import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const user = await User.findById(auth.user._id).select('-password').lean();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch profile.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { username, bio, avatar, banner } = (await req.json()) as {
      username?: string;
      bio?: string;
      avatar?: string;
      banner?: string;
    };

    if (username) {
      const taken = await User.findOne({ username, _id: { $ne: auth.user._id } });
      if (taken) {
        return NextResponse.json({ message: 'Username already taken.' }, { status: 400 });
      }
    }

    const user = await User.findByIdAndUpdate(
      auth.user._id,
      {
        $set: {
          ...(username && { username }),
          ...(bio !== undefined && { bio }),
          ...(avatar !== undefined && { avatar }),
          ...(banner !== undefined && { banner }),
        },
      },
      { new: true, runValidators: true },
    ).select('-password');

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: 'Failed to update profile.' }, { status: 500 });
  }
}
