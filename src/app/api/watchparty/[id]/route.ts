import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import WatchParty from '@/models/WatchParty';

export async function PUT(
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

    const { name, season, isPublic } = await req.json();
    if (name !== undefined) party.name = name;
    if (season !== undefined) party.season = season;
    if (isPublic !== undefined) party.isPublic = isPublic;

    await party.save();
    return NextResponse.json({ party });
  } catch {
    return NextResponse.json({ message: 'Failed to update watch party.' }, { status: 500 });
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
    await WatchParty.findOneAndDelete({ _id: id, userId: auth.user._id });
    return NextResponse.json({ message: 'Watch party deleted.' });
  } catch {
    return NextResponse.json({ message: 'Failed to delete watch party.' }, { status: 500 });
  }
}
