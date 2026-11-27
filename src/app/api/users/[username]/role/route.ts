import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import User from '@/models/User';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { username: id } = await params;
    const { role } = (await req.json()) as { role: 'user' | 'admin' };
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json({ message: 'Invalid role.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: 'Failed to update role.' }, { status: 500 });
  }
}
