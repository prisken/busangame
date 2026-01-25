import fs from 'fs';
import path from 'path';
import { createClient } from '@vercel/kv';
import { Team, INITIAL_TASKS } from './definitions';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Debug: Log all environment variable keys (not values) to see what's available
console.log('Available Env Vars:', Object.keys(process.env).filter(key => key.startsWith('KV_') || key.startsWith('BLOB_') || key.startsWith('REDIS_')));

// Check if Vercel KV is configured
const kvUrl = process.env.KV_REST_API_URL || process.env.KV_URL || process.env.REDIS_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.KV_TOKEN || process.env.REDIS_TOKEN; 

const isKVConfigured = !!kvUrl;

console.log('KV Configured:', isKVConfigured); 
if (!isKVConfigured) {
    console.log('Missing KV credentials. URL present:', !!kvUrl);
}

let kv: any = null;

if (isKVConfigured) {
    try {
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
             kv = createClient({
                url: process.env.KV_REST_API_URL,
                token: process.env.KV_REST_API_TOKEN,
            });
        } 
        else if (kvUrl) {
             console.log('Attempting to use generic KV/Redis URL:', kvUrl.substring(0, 10) + '...');
             
             if (kvUrl.startsWith('redis://')) {
                 console.warn('WARNING: Detected redis:// URL. @vercel/kv requires HTTP REST API. You might need to use "ioredis" package or check Vercel Storage settings for KV REST API details.');
             }
             
             kv = createClient({
                url: kvUrl,
                token: kvToken || '',
            });
        }
    } catch (e) {
        console.error('Failed to create KV client:', e);
    }
}

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
      // Fix: kv.get might not be generic in the version installed or when typed as 'any'
      const teams = await kv.get('teams') as Team[];
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
