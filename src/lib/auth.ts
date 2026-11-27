import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from './db';
import User, { IUser } from '@/models/User';

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

export function setAuthCookie(res: NextResponse, userId: string): string {
  const token = generateToken(userId);
  res.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return token;
}

export async function getAuthUser(req: NextRequest): Promise<IUser | null> {
  try {
    let token: string | undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      token = req.cookies.get('token')?.value;
    }

    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const decoded = jwt.verify(token, secret) as { id: string };
    await connectDB();
    const user = await User.findById(decoded.id).select('-password');
    return user || null;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: NextRequest,
): Promise<{ user: IUser; error?: never } | { user?: never; error: NextResponse }> {
  const user = await getAuthUser(req);
  if (!user) {
    return {
      error: NextResponse.json(
        { message: 'Not authorized — no valid token provided.' },
        { status: 401 },
      ),
    };
  }
  return { user };
}

export async function requireAdmin(
  req: NextRequest,
): Promise<{ user: IUser; error?: never } | { user?: never; error: NextResponse }> {
  const auth = await requireAuth(req);
  if (auth.error) return auth;
  if (auth.user.role !== 'admin') {
    return {
      error: NextResponse.json({ message: 'Admin access required.' }, { status: 403 }),
    };
  }
  return { user: auth.user };
}
