import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import MediaEntry from '@/models/MediaEntry';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Invalid user ID.' }, { status: 400 });
    }

    await connectDB();
    const status = req.nextUrl.searchParams.get('status');
    const type = req.nextUrl.searchParams.get('type');

    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    if (type) filter.mediaType = type;

    const entries = await MediaEntry.find(filter).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch library.' }, { status: 500 });
  }
}
