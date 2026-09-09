import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with server-side env vars (never exposed to browser)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');

    if (!isImage && !isAudio) {
      return NextResponse.json({ error: 'Only image and audio files are allowed' }, { status: 400 });
    }

    // Max 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 15MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If Cloudinary keys are present, upload to Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const result = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'moneyhiest/uploads',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error || !result) reject(error || new Error('Upload failed'));
              else resolve(result as { secure_url: string; public_id: string });
            }
          ).end(buffer);
        }
      );

      return NextResponse.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    // Fallback: Data URL if Cloudinary env vars are missing
    const mime = file.type || (isAudio ? 'audio/mpeg' : 'image/png');
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mime};base64,${base64Data}`;

    return NextResponse.json({
      url: dataUrl,
      publicId: `local-${Date.now()}`,
    });
  } catch (err: any) {
    console.error('[Cloudinary Upload Error]', err);
    return NextResponse.json(
      { error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
