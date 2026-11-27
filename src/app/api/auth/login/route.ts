import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ message: 'No account found with that email.' }, { status: 401 });
    }
    if (!user.password) {
      return NextResponse.json(
        { message: 'This account uses social login. Please sign in with Google.' },
        { status: 401 },
      );
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return NextResponse.json({ message: 'Incorrect password.' }, { status: 401 });
    }

    const res = NextResponse.json({ token: '', user: user.toJSON() });
    const token = setAuthCookie(res, user._id.toString());
    return NextResponse.json({ token, user: user.toJSON() }, { headers: res.headers });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Login failed.' }, { status: 500 });
  }
}
