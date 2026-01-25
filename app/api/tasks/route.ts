import { NextResponse } from 'next/server';
import { getTeam, updateTeam } from '@/app/lib/store';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const { teamId, taskId, completed, image } = await request.json();
  
  const team = getTeam(teamId);
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
    // If it's a base64 string (new upload), save it to disk
    if (image && image.startsWith('data:image')) {
      try {
        // Extract base64 data
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          
          // Create unique filename
          const filename = `${teamId}-${taskId}-${Date.now()}.jpg`;
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          
          // Ensure directory exists
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          // Write file
          const filepath = path.join(uploadDir, filename);
          fs.writeFileSync(filepath, buffer);
          
          // Update task with the public URL
          team.tasks[taskIndex].image = `/uploads/${filename}`;
        }
      } catch (error) {
        console.error('Error saving image:', error);
        return NextResponse.json({ success: false, message: 'Failed to save image' }, { status: 500 });
      }
    } else {
      // If it's null (clearing image) or not a base64 string, just assign it
      team.tasks[taskIndex].image = image;
    }
  }

  updateTeam(team);

  return NextResponse.json({ success: true, team });
}
