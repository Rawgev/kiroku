import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import WatchParty from '@/models/WatchParty';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    await connectDB();
    const party = await WatchParty.findOne({ _id: id, userId: auth.user._id });
    if (!party) {
      return NextResponse.json({ message: 'Watch party not found.' }, { status: 404 });
    }

    const { mediaId, title, coverImage, totalEps, airingDay, mediaType } = await req.json();
    const alreadyIn = party.items.find((i: { mediaId: number }) => i.mediaId === mediaId);
    if (alreadyIn) {
      return NextResponse.json({ message: 'Already in this watch party.' }, { status: 400 });
    }

    party.items.push({
      mediaId,
      title,
      coverImage,
      mediaType: mediaType || 'anime',
      currentEp: 0,
      totalEps,
      airingDay,
      completed: false,
    });
    await party.save();
    return NextResponse.json({ party });
  } catch {
    return NextResponse.json({ message: 'Failed to add item.' }, { status: 500 });
  }
}
