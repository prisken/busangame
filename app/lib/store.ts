import fs from 'fs';
import path from 'path';
import { createClient } from '@vercel/kv';
import { Team, INITIAL_TASKS } from './definitions';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Check if Vercel KV is configured
const isKVConfigured = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

const kv = isKVConfigured
  ? createClient({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  : null;

// Initialize DB with 10 teams if not exists
async function initDB() {
  if (isKVConfigured && kv) {
    const exists = await kv.exists('teams');
    if (!exists) {
      const teams: Team[] = Array.from({ length: 10 }, (_, i) => ({
        id: `team${i + 1}`,
        name: `Team ${i + 1}`,
        password: `busan${i + 1}`,
        tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
      }));
      await kv.set('teams', teams);
    }
  } else {
    // Local fallback
    if (!fs.existsSync(DB_PATH)) {
      const teams: Team[] = Array.from({ length: 10 }, (_, i) => ({
        id: `team${i + 1}`,
        name: `Team ${i + 1}`,
        password: `busan${i + 1}`,
        tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
      }));
      fs.writeFileSync(DB_PATH, JSON.stringify({ teams }, null, 2));
    }
  }
}

export async function getTeams(): Promise<Team[]> {
  await initDB();
  
  if (isKVConfigured && kv) {
    const teams = await kv.get<Team[]>('teams');
    return teams || [];
  } else {
    // Local fallback
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data).teams;
    }
    return [];
  }
}

export async function getTeam(id: string): Promise<Team | undefined> {
  const teams = await getTeams();
  return teams.find((t) => t.id === id);
}

export async function updateTeam(updatedTeam: Team): Promise<void> {
  const teams = await getTeams();
  const index = teams.findIndex((t) => t.id === updatedTeam.id);
  
  if (index !== -1) {
    teams[index] = updatedTeam;
    
    if (isKVConfigured && kv) {
      await kv.set('teams', teams);
    } else {
      // Local fallback
      fs.writeFileSync(DB_PATH, JSON.stringify({ teams }, null, 2));
    }
  }
}
