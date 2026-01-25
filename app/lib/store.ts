import fs from 'fs';
import path from 'path';
import { createClient } from '@vercel/kv';
import { Team, INITIAL_TASKS } from './definitions';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Check if Vercel KV is configured
const isKVConfigured = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

console.log('KV Configured:', isKVConfigured); // Debug log

const kv = isKVConfigured
  ? createClient({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  : null;

// Initialize DB with 10 teams if not exists
async function initDB() {
  if (isKVConfigured && kv) {
    try {
      const exists = await kv.exists('teams');
      if (!exists) {
        console.log('Initializing KV database...');
        const teams: Team[] = Array.from({ length: 10 }, (_, i) => ({
          id: `team${i + 1}`,
          name: `Team ${i + 1}`,
          password: `busan${i + 1}`,
          tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
        }));
        await kv.set('teams', teams);
        console.log('KV database initialized.');
      }
    } catch (error) {
      console.error('Error initializing KV:', error);
    }
  } else {
    // Local fallback
    // Only try to write if we are NOT in a serverless environment (simple check) or just try/catch
    try {
        if (!fs.existsSync(DB_PATH)) {
        const teams: Team[] = Array.from({ length: 10 }, (_, i) => ({
            id: `team${i + 1}`,
            name: `Team ${i + 1}`,
            password: `busan${i + 1}`,
            tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
        }));
        fs.writeFileSync(DB_PATH, JSON.stringify({ teams }, null, 2));
        }
    } catch (err) {
        console.warn('Could not write to local DB (init):', err);
    }
  }
}

export async function getTeams(): Promise<Team[]> {
  await initDB();
  
  if (isKVConfigured && kv) {
    try {
      const teams = await kv.get<Team[]>('teams');
      console.log('Fetched teams from KV:', teams ? teams.length : 0);
      return teams || [];
    } catch (error) {
      console.error('Error fetching teams from KV:', error);
      return [];
    }
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
      try {
        await kv.set('teams', teams);
        console.log(`Updated team ${updatedTeam.id} in KV`);
      } catch (error) {
        console.error('Error updating team in KV:', error);
      }
    } else {
      // Local fallback
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify({ teams }, null, 2));
      } catch (err) {
        console.error('Failed to write to local DB (likely read-only fs):', err);
      }
    }
  }
}
