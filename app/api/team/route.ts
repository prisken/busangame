import { NextResponse } from 'next/server';
import { getTeam, updateTeam } from '@/app/lib/store';

export async function POST(request: Request) {
  const { teamId, name } = await request.json();
  
  const team = await getTeam(teamId);
  if (!team) {
    return NextResponse.json({ success: false, message: 'Team not found' }, { status: 404 });
  }

  if (name) {
    team.name = name;
  }

  await updateTeam(team);

  return NextResponse.json({ success: true, team });
}
