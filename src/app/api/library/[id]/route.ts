import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import MediaEntry from '@/models/MediaEntry';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    await connectDB();
    const entry = await MediaEntry.findOne({ _id: id, userId: auth.user._id });
    if (!entry) {
      return NextResponse.json({ message: 'Entry not found.' }, { status: 404 });
    }

    const body = await req.json();
    const allowed = ['status', 'score', 'progress', 'totalProgress', 'notes', 'isFavorite', 'startDate', 'finishDate', 'rewatches'];
    allowed.forEach((field) => {
      if (body[field] !== undefined) {
        (entry as Record<string, unknown>)[field] = body[field];
      }
    });

    if (entry.status === 'completed' && entry.totalProgress) {
      entry.progress = entry.totalProgress;
    }

    await entry.save();
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ message: 'Failed to update entry.' }, { status: 500 });
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
    const entry = await MediaEntry.findOneAndDelete({ _id: id, userId: auth.user._id });
    if (!entry) {
      return NextResponse.json({ message: 'Entry not found.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Entry removed.' });
  } catch {
    return NextResponse.json({ message: 'Failed to remove entry.' }, { status: 500 });
  }
}
