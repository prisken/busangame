import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
  }

  const filename = `${Date.now()}-${file.name.replaceAll(' ', '_')}`;

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        // Vercel Blob
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
