import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth } from '@/lib/auth';

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { image } = (await req.json()) as { image?: string };
    if (!image) {
      return NextResponse.json({ message: 'No image data provided.' }, { status: 400 });
    }

    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: 'kiroku_profile',
      });
      return NextResponse.json({ url: uploadRes.secure_url });
    }

    // Serverless-safe fallback when Cloudinary is not configured: validate data URI and return it directly
    const matches = image.match(/^data:image\/[A-Za-z0-9-+\/]+;base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ message: 'Invalid base64 image format.' }, { status: 400 });
    }

    return NextResponse.json({ url: image });
  } catch (err: unknown) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { message: 'Failed to upload image.', error: (err as Error).message },
      { status: 500 },
    );
  }
}
