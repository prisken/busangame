import { NextResponse } from 'next/server';
import { getTeams } from '@/app/lib/store';

export async function POST(request: Request) {
  const { teamId, password } = await request.json();
  const teams = await getTeams();
  const team = teams.find((t) => t.id === teamId && t.password === password);

  if (team) {
    return NextResponse.json({ success: true, team });
  } else {
    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }
}
