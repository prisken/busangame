import fs from 'fs';
import path from 'path';
import { createClient } from '@vercel/kv';
import { Team, INITIAL_TASKS } from './definitions';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Debug: Log all environment variable keys (not values) to see what's available
console.log('Available Env Vars:', Object.keys(process.env).filter(key => key.startsWith('KV_') || key.startsWith('BLOB_') || key.startsWith('REDIS_')));

// Check if Vercel KV is configured
// Vercel sometimes uses KV_URL or KV_REST_API_URL depending on the integration
// It seems you have REDIS_URL, so we'll try to use that if KV_... are missing.
const kvUrl = process.env.KV_REST_API_URL || process.env.KV_URL || process.env.REDIS_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.KV_TOKEN || process.env.REDIS_TOKEN; 

// Note: REDIS_URL usually contains the full connection string (redis://...), 
// but @vercel/kv expects REST API URL/Token. 
// If you are using standard Redis integration (not Vercel KV specific), we might need a different client or config.
// However, let's see if we can make it work or if we need to switch to 'redis' package.

const isKVConfigured = !!kvUrl; // Token might be embedded in URL for standard Redis

console.log('KV Configured:', isKVConfigured); 
if (!isKVConfigured) {
    console.log('Missing KV credentials. URL present:', !!kvUrl);
}

// If using generic Redis URL, we might need to parse it or use a different client if @vercel/kv doesn't support it directly.
// @vercel/kv is specifically for Vercel KV (Upstash).
// If you attached "Redis" from the marketplace (not Vercel KV), you get REDIS_URL.

let kv: any = null;

if (isKVConfigured) {
    try {
        // If we have specific KV REST API vars, use them (preferred for Vercel KV)
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
             kv = createClient({
                url: process.env.KV_REST_API_URL,
                token: process.env.KV_REST_API_TOKEN,
            });
        } 
        // If we only have REDIS_URL, it might be a standard Redis connection string.
        // @vercel/kv uses HTTP, standard Redis uses TCP.
        // If you are using Vercel KV, you should have KV_REST_API_...
        // If you are using "Redis" integration, you might need 'ioredis' or 'redis' package.
        // BUT, let's try to see if we can use the Vercel KV client if the URL is compatible.
        else if (kvUrl) {
             // Fallback: Try to use the URL. 
             // Note: This might fail if it's a TCP URL (redis://) and we use the HTTP client.
             // We will log this.
             console.log('Attempting to use generic KV/Redis URL:', kvUrl.substring(0, 10) + '...');
             
             // If it's a redis:// URL, @vercel/kv might not work.
             // We will assume for now we need the specific KV vars.
             if (kvUrl.startsWith('redis://')) {
                 console.warn('WARNING: Detected redis:// URL. @vercel/kv requires HTTP REST API. You might need to use "ioredis" package or check Vercel Storage settings for KV REST API details.');
             }
             
             kv = createClient({
                url: kvUrl,
                token: kvToken || '', // Token might be optional or in URL
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
      const teams = await kv.get<Team[]>('teams');
      // console.log('Fetched teams from KV:', teams ? teams.length : 0);
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
