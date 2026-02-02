'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  totalBlocked: number;
  totalAllowed: number;
  byDomain: Record<string, number>;
  byCategory: Record<string, number>;
}

interface Streak {
  currentStreak: number;
  longestStreak: number;
}

interface Preferences {
  syncToken: string;
  focusModeEnabled: boolean;
  whitelist: string[];
  blacklist: string[];
  youtubeBlockedCategories: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [whitelistDomain, setWhitelistDomain] = useState('');
  const [blacklistDomain, setBlacklistDomain] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [analyticsRes, preferencesRes] = await Promise.all([
        fetch('/api/analytics?period=week'),
        fetch('/api/preferences'),
      ]);

      if (!analyticsRes.ok || !preferencesRes.ok) {
        router.push('/login');
        return;
      }

      const analyticsData = await analyticsRes.json();
      const preferencesData = await preferencesRes.json();

      setStats(analyticsData.stats);
      setStreak(analyticsData.streak);
      setPreferences(preferencesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFocusMode() {
    if (!preferences) return;

    const updated = { ...preferences, focusModeEnabled: !preferences.focusModeEnabled };

    const response = await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (response.ok) {
      setPreferences(updated);
    }
  }

  async function addToWhitelist() {
    if (!preferences || !whitelistDomain.trim()) return;

    const updated = {
      ...preferences,
      whitelist: [...preferences.whitelist, whitelistDomain.trim()],
    };

    const response = await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (response.ok) {
      setPreferences(updated);
      setWhitelistDomain('');
    }
  }

  async function addToBlacklist() {
    if (!preferences || !blacklistDomain.trim()) return;

    const updated = {
      ...preferences,
      blacklist: [...preferences.blacklist, blacklistDomain.trim()],
    };

    const response = await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (response.ok) {
      setPreferences(updated);
      setBlacklistDomain('');
    }
  }

  async function removeDomain(list: 'whitelist' | 'blacklist', domain: string) {
    if (!preferences) return;

    const updated = {
      ...preferences,
      [list]: preferences[list].filter((d) => d !== domain),
    };

    const response = await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (response.ok) {
      setPreferences(updated);
    }
  }

  async function toggleYoutubeCategory(category: string) {
    if (!preferences) return;

    const currentCategories = preferences.youtubeBlockedCategories || [];
    const isBlocked = currentCategories.includes(category);
    const updated = {
      ...preferences,
      youtubeBlockedCategories: isBlocked
        ? currentCategories.filter(c => c !== category)
        : [...currentCategories, category],
    };

    const response = await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (response.ok) {
      setPreferences(updated);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-purple-600">🔒 LockIn</h1>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Track your productivity and manage your settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase">Sites Blocked</h3>
            <p className="text-4xl font-bold text-purple-600 mt-2">{stats?.totalBlocked || 0}</p>
            <p className="text-sm text-gray-500 mt-1">This week</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase">Current Streak</h3>
            <p className="text-4xl font-bold text-green-600 mt-2">{streak?.currentStreak || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Days focused</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase">Longest Streak</h3>
            <p className="text-4xl font-bold text-blue-600 mt-2">{streak?.longestStreak || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Personal best</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Focus Mode</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.focusModeEnabled}
                onChange={toggleFocusMode}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600">
            {preferences?.focusModeEnabled
              ? 'Focus mode is active. Distracting sites are blocked.'
              : 'Focus mode is disabled. All sites are accessible.'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">YouTube Content Filtering</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select which types of YouTube content to block. Gaming, vlogs, and entertainment will be blocked while educational content remains accessible.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['gaming', 'vlog', 'comedy', 'music', 'sports', 'reaction', 'entertainment'].map((category) => (
              <label key={category} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(preferences?.youtubeBlockedCategories || []).includes(category)}
                  onChange={() => toggleYoutubeCategory(category)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-900 capitalize">{category}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Extension Sync Token</h3>
          <div className="bg-gray-50 p-4 rounded border border-gray-200 font-mono text-sm text-gray-900">
            {preferences?.syncToken || 'No token available'}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Copy this token and paste it in your Chrome extension to sync settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Whitelist</h3>
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={whitelistDomain}
                  onChange={(e) => setWhitelistDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                />
                <button
                  onClick={addToWhitelist}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {preferences?.whitelist.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-900">{domain}</span>
                  <button
                    onClick={() => removeDomain('whitelist', domain)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Blacklist</h3>
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={blacklistDomain}
                  onChange={(e) => setBlacklistDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                />
                <button
                  onClick={addToBlacklist}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Block
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {preferences?.blacklist.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-900">{domain}</span>
                  <button
                    onClick={() => removeDomain('blacklist', domain)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
