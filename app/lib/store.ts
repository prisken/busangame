import fs from 'fs';
import path from 'path';
import { Team, INITIAL_TASKS } from './definitions';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Initialize DB with 10 teams if not exists
function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    const teams: Team[] = Array.from({ length: 10 }, (_, i) => ({
      id: `team${i + 1}`,
      name: `Team ${i + 1}`,
      password: `busan${i + 1}`, // Simple default password
      tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)), // Deep copy
    }));
    fs.writeFileSync(DB_PATH, JSON.stringify({ teams }, null, 2));
  }
}

export function getTeams(): Team[] {
  initDB();
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data).teams;
}

export function getTeam(id: string): Team | undefined {
  const teams = getTeams();
  return teams.find((t) => t.id === id);
}

export function updateTeam(updatedTeam: Team) {
  const teams = getTeams();
  const index = teams.findIndex((t) => t.id === updatedTeam.id);
  if (index !== -1) {
    teams[index] = updatedTeam;
    fs.writeFileSync(DB_PATH, JSON.stringify({ teams }, null, 2));
  }
}
