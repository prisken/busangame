'use client';

import { useState, useEffect } from 'react';
import { Team, Task } from '@/app/lib/definitions';
import TaskCard from '@/app/components/TaskCard';
import { LogIn } from 'lucide-react';

export default function Home() {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Login State
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Hydrate from localStorage if available (optional, but good for refresh)
  useEffect(() => {
    const storedTeam = localStorage.getItem('busan_team');
    if (storedTeam) {
      setTeam(JSON.parse(storedTeam));
    }

    // Load saved login credentials
    const savedTeamId = localStorage.getItem('busan_saved_teamId');
    const savedPassword = localStorage.getItem('busan_saved_password');
    if (savedTeamId) setTeamId(savedTeamId);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, password }),
      });

      const data = await res.json();

      if (data.success) {
        setTeam(data.team);
        localStorage.setItem('busan_team', JSON.stringify(data.team));
        
        // Save credentials for next time
        localStorage.setItem('busan_saved_teamId', teamId);
        localStorage.setItem('busan_saved_password', password);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    if (!team) return;

    // Optimistic update
    const updatedTasks = team.tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    );
    const updatedTeam = { ...team, tasks: updatedTasks };
    setTeam(updatedTeam);
    localStorage.setItem('busan_team', JSON.stringify(updatedTeam));

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: team.id,
          taskId,
          ...updates,
        }),
      });
    } catch (err) {
      console.error('Failed to sync update', err);
      // Revert if needed, but for now we keep optimistic state
    }
  };

  const handleLogout = () => {
    setTeam(null);
    localStorage.removeItem('busan_team');
    // We do NOT clear saved credentials on logout so they are there for next login
    // If you want to clear them, uncomment the next lines:
    // localStorage.removeItem('busan_saved_teamId');
    // localStorage.removeItem('busan_saved_password');
    // setTeamId('team1');
    // setPassword('busan1');
  };

  const handleNameChange = async () => {
    if (!team) return;
    const newName = prompt('Enter new team name:', team.name);
    if (newName && newName !== team.name) {
      const updatedTeam = { ...team, name: newName };
      setTeam(updatedTeam);
      localStorage.setItem('busan_team', JSON.stringify(updatedTeam));
      
      try {
         await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: team.id, name: newName }),
        });
      } catch (err) {
        console.error('Failed to update team name', err);
      }
    }
  };

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Busan Game 🇰🇷</h1>
            <p className="text-gray-600 mt-2">Team Login</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team ID</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>Select a Team</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={`team${i + 1}`}>Team {i + 1}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : <><LogIn size={18} /> Login</>}
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-gray-400">
            Default password is "busan" + team number (e.g., busan1)
          </div>
        </div>
      </div>
    );
  }

  // Group tasks by category
  const tasksByCategory = team.tasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const completedCount = team.tasks.filter(t => t.completed).length;
  const totalTasks = team.tasks.length;
  const progress = (completedCount / totalTasks) * 100;

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Busan Game 🇰🇷</h1>
            <button 
              onClick={handleNameChange}
              className="text-2xl font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2"
            >
              {team.name}
              <span className="text-sm font-normal text-gray-400">✎</span>
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Logout
          </button>
        </div>
        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-200 w-full">
          <div 
            className="h-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
          <span className="font-medium text-gray-700">Progress</span>
          <span className="font-bold text-blue-600">{completedCount} / {totalTasks} Tasks Completed</span>
        </div>

        {Object.entries(tasksByCategory).map(([category, tasks]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 border-l-4 border-blue-500 pl-3">{category}</h2>
            <div className="grid gap-4">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={handleTaskUpdate} />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
