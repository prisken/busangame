import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
import { Team, INITIAL_TASKS } from './definitions';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Check for Redis configuration
const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
const isRedisConfigured = !!redisUrl;

console.log('Redis Configured:', isRedisConfigured);

let redis: Redis | null = null;

if (isRedisConfigured && redisUrl) {
    try {
        console.log('Initializing Redis client with URL:', redisUrl.substring(0, 10) + '...');
        // ioredis handles redis:// URLs natively
        redis = new Redis(redisUrl);
        
        redis.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });
        
        redis.on('connect', () => {
            console.log('Redis Client Connected');
        });

    } catch (e) {
        console.error('Failed to create Redis client:', e);
    }
}

// Initialize DB with 10 teams if not exists
async function initDB() {
  if (isRedisConfigured && redis) {
    try {
      const exists = await redis.exists('teams');
      if (!exists) {
        console.log('Initializing Redis database...');
        const teams: Team[] = Array.from({ length: 10 }, (_, i) => ({
          id: `team${i + 1}`,
          name: `Team ${i + 1}`,
          password: `busan${i + 1}`,
          tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
        }));
        await redis.set('teams', JSON.stringify(teams));
        console.log('Redis database initialized.');
      }
    } catch (error) {
      console.error('Error initializing Redis:', error);
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
  
  if (isRedisConfigured && redis) {
    try {
      const data = await redis.get('teams');
      if (data) {
          const teams = JSON.parse(data) as Team[];
          // console.log('Fetched teams from Redis:', teams.length);
          return teams;
      }
      return [];
    } catch (error) {
      console.error('Error fetching teams from Redis:', error);
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
    
    if (isRedisConfigured && redis) {
      try {
        await redis.set('teams', JSON.stringify(teams));
        console.log(`Updated team ${updatedTeam.id} in Redis`);
      } catch (error) {
        console.error('Error updating team in Redis:', error);
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
