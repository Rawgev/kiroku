import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import WatchParty from '@/models/WatchParty';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const parties = await WatchParty.find({ userId: auth.user._id }).sort({ createdAt: -1 });
    return NextResponse.json({ parties });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch watch parties.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { name, season, isPublic } = await req.json();
    const party = await WatchParty.create({
      userId: auth.user._id,
      name,
      season,
      items: [],
      isPublic: isPublic || false,
    });
    return NextResponse.json({ party }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Failed to create watch party.' }, { status: 500 });
  }
}
