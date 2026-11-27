import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { setAuthCookie } from '@/lib/auth';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
}

export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=google_failed`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${origin}/login?error=google_not_configured`);
    }

    const redirectUri = `${origin}/api/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(`${origin}/login?error=google_failed`);
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      return NextResponse.redirect(`${origin}/login?error=google_failed`);
    }

    const profile = (await userRes.json()) as GoogleUserInfo;
    await connectDB();

    let user = await User.findOne({ googleId: profile.id });
    if (!user && profile.email) {
      user = await User.findOne({ email: profile.email.toLowerCase() });
      if (user) {
        user.googleId = profile.id;
        if (!user.avatar && profile.picture) user.avatar = profile.picture;
        await user.save();
      }
    }

    if (!user) {
      const baseUsername = (profile.name || 'user')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .slice(0, 18) || 'user';
      const username = `${baseUsername}_${Date.now().toString().slice(-4)}`;

      user = await User.create({
        username,
        email: profile.email || `google_${profile.id}@placeholder.com`,
        googleId: profile.id,
        avatar: profile.picture || '',
        provider: 'google',
      });
    }

    const res = NextResponse.redirect(`${origin}/oauth/callback?token=`);
    const token = setAuthCookie(res, user._id.toString());
    const finalRes = NextResponse.redirect(`${origin}/oauth/callback?token=${encodeURIComponent(token)}`);
    res.cookies.getAll().forEach((c) => finalRes.cookies.set(c));
    return finalRes;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${origin}/login?error=google_failed`);
  }
}
