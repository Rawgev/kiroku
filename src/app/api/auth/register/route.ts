import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = (await req.json()) as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !email || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    await connectDB();

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json({ message: 'Email already registered.' }, { status: 400 });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json({ message: 'Username already taken.' }, { status: 400 });
    }

    const user = await User.create({ username, email, password, provider: 'local' });
    const res = NextResponse.json({ token: '', user: user.toJSON() }, { status: 201 });
    const token = setAuthCookie(res, user._id.toString());

    return NextResponse.json({ token, user: user.toJSON() }, { status: 201, headers: res.headers });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ message: 'Registration failed.' }, { status: 500 });
  }
}
