import { NextResponse } from 'next/server';
import { getTeam, updateTeam } from '@/app/lib/store';
import { put, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { unlink } from 'fs/promises';

export async function POST(request: Request) {
  const { teamId, taskId, completed, image } = await request.json();
  
  const team = await getTeam(teamId);
  if (!team) {
    return NextResponse.json({ success: false, message: 'Team not found' }, { status: 404 });
  }

  const taskIndex = team.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
  }

  // Update fields if provided
  if (completed !== undefined) team.tasks[taskIndex].completed = completed;
  
  if (image !== undefined) {
    // Handle deletion of old image if it exists and is being changed/removed
    const oldImage = team.tasks[taskIndex].image;
    // Check if oldImage exists AND it is different from the new image (or new image is null)
    if (oldImage && oldImage !== image) {
        try {
            if (oldImage.startsWith('/uploads/')) {
                // Local deletion
                const filename = oldImage.split('/uploads/')[1];
                const filepath = path.join(process.cwd(), 'public', 'uploads', filename);
                if (fs.existsSync(filepath)) {
                    await unlink(filepath);
                }
            } else if (oldImage.startsWith('http') && process.env.BLOB_READ_WRITE_TOKEN) {
                 // Vercel Blob deletion
                 await del(oldImage);
            }
        } catch (error) {
            console.error('Error deleting old image:', error);
            // Continue execution even if delete fails
        }
    }

    // If it's a base64 string (new upload), save it
    if (image && image.startsWith('data:image')) {
      try {
        // Extract base64 data
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `${teamId}-${taskId}-${Date.now()}.jpg`;

          if (process.env.BLOB_READ_WRITE_TOKEN) {
             // Vercel Blob
             const blob = await put(filename, buffer, { access: 'public' });
             team.tasks[taskIndex].image = blob.url;
          } else {
             // Local Fallback
             const uploadDir = path.join(process.cwd(), 'public', 'uploads');
             if (!fs.existsSync(uploadDir)) {
               fs.mkdirSync(uploadDir, { recursive: true });
             }
             const filepath = path.join(uploadDir, filename);
             fs.writeFileSync(filepath, buffer);
             team.tasks[taskIndex].image = `/uploads/${filename}`;
          }
        }
      } catch (error) {
        console.error('Error saving image:', error);
        return NextResponse.json({ success: false, message: 'Failed to save image' }, { status: 500 });
      }
    } else {
      // If it's null (clearing image) or not a base64 string (e.g. URL from /api/upload), just assign it
      team.tasks[taskIndex].image = image;
    }
  }

  await updateTeam(team);

  return NextResponse.json({ success: true, team });
}
