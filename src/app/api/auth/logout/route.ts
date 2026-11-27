import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out successfully.' });
  res.cookies.delete('token');
  return res;
}
