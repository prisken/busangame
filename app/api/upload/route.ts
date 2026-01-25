import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { put, handleUpload, type HandleUploadBody } from '@vercel/blob';

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || '';

  // 1. Handle Vercel Blob Client Upload Handshake (JSON)
  if (contentType.includes('application/json')) {
    const body = (await request.json()) as HandleUploadBody;

    try {
      const jsonResponse = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname) => {
          // Allow all uploads for now, or restrict if needed
          return {
            allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'],
            tokenPayload: JSON.stringify({
              // optional, sent to your server on upload completion
            }),
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          // You can update the DB here if you want, but we do it on the client side for simplicity in this app
          console.log('Blob upload completed:', blob.url);
        },
      });
      return NextResponse.json(jsonResponse);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 },
      );
    }
  }

  // 2. Handle Local / Server-side Upload (Multipart Form Data)
  // This is used for Local Development OR if the client falls back to this
  try {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
      }

      const filename = `${Date.now()}-${file.name.replaceAll(' ', '_')}`;

      if (process.env.BLOB_READ_WRITE_TOKEN) {
          // Server-side Vercel Blob upload (Limited to 4.5MB on Vercel Functions)
          // We prefer Client-side upload for Vercel, but keep this as fallback/legacy
          const blob = await put(filename, file, { access: 'public' });
          return NextResponse.json({ success: true, url: blob.url });
      } else {
          // Local Fallback
          const buffer = Buffer.from(await file.arrayBuffer());
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');

          // Ensure directory exists
          if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
          }

          await writeFile(path.join(uploadDir, filename), buffer);
          return NextResponse.json({ success: true, url: `/uploads/${filename}` });
      }
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
