import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import WatchParty from '@/models/WatchParty';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id, itemId } = await params;
    await connectDB();
    const party = await WatchParty.findOne({ _id: id, userId: auth.user._id });
    if (!party) {
      return NextResponse.json({ message: 'Watch party not found.' }, { status: 404 });
    }

    const item = party.items.find((i: { _id: { toString(): string } }) => i._id.toString() === itemId);
    if (!item) {
      return NextResponse.json({ message: 'Item not found.' }, { status: 404 });
    }

    const { currentEp, completed } = await req.json();
    if (currentEp !== undefined) item.currentEp = currentEp;
    if (completed !== undefined) item.completed = completed;

    await party.save();
    return NextResponse.json({ party });
  } catch {
    return NextResponse.json({ message: 'Failed to update item.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id, itemId } = await params;
    await connectDB();
    const party = await WatchParty.findOne({ _id: id, userId: auth.user._id });
    if (!party) {
      return NextResponse.json({ message: 'Watch party not found.' }, { status: 404 });
    }

    party.items = party.items.filter((i: { _id: { toString(): string } }) => i._id.toString() !== itemId);
    await party.save();
    return NextResponse.json({ party });
  } catch {
    return NextResponse.json({ message: 'Failed to remove item.' }, { status: 500 });
  }
}
