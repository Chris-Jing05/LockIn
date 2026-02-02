import React, { useEffect, useState } from 'react';

interface Preferences {
  focusModeEnabled: boolean;
  whitelist: string[];
  blacklist: string[];
}

interface Stats {
  blockedToday: number;
  streak: number;
}

const Popup: React.FC = () => {
  const [preferences, setPreferences] = useState<Preferences>({
    focusModeEnabled: true,
    whitelist: [],
    blacklist: [],
  });
  const [stats, setStats] = useState<Stats>({ blockedToday: 0, streak: 0 });
  const [syncToken, setSyncToken] = useState<string>('');
  const [newDomain, setNewDomain] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await chrome.storage.local.get([
      'preferences',
      'blockedToday',
      'streak',
      'syncToken',
    ]);

    if (data.preferences) {
      setPreferences(data.preferences);
    }

    setStats({
      blockedToday: data.blockedToday || 0,
      streak: data.streak || 0,
    });

    if (data.syncToken) {
      setSyncToken(data.syncToken);
      setIsLoggedIn(true);
    }
  }

  async function toggleFocusMode() {
    const updated = {
      ...preferences,
      focusModeEnabled: !preferences.focusModeEnabled,
    };

    setPreferences(updated);

    await chrome.runtime.sendMessage({
      type: 'UPDATE_PREFERENCES',
      preferences: updated,
    });
  }

  async function addToWhitelist() {
    if (!newDomain.trim()) return;

    const updated = {
      ...preferences,
      whitelist: [...preferences.whitelist, newDomain.trim()],
    };

    setPreferences(updated);
    setNewDomain('');

    await chrome.runtime.sendMessage({
      type: 'UPDATE_PREFERENCES',
      preferences: updated,
    });
  }

  async function addToBlacklist() {
    if (!newDomain.trim()) return;

    const updated = {
      ...preferences,
      blacklist: [...preferences.blacklist, newDomain.trim()],
    };

    setPreferences(updated);
    setNewDomain('');

    await chrome.runtime.sendMessage({
      type: 'UPDATE_PREFERENCES',
      preferences: updated,
    });
  }

  async function removeDomain(list: 'whitelist' | 'blacklist', domain: string) {
    const updated = {
      ...preferences,
      [list]: preferences[list].filter((d) => d !== domain),
    };

    setPreferences(updated);

    await chrome.runtime.sendMessage({
      type: 'UPDATE_PREFERENCES',
      preferences: updated,
    });
  }

  async function saveSyncToken() {
    await chrome.storage.local.set({ syncToken });
    setIsLoggedIn(true);
  }

  function openDashboard() {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  }

  return (
    <div className="popup">
      <div className="header">
        <h1>🔒 LockIn</h1>
        <p>Stay focused, stay productive</p>
      </div>

      {!isLoggedIn ? (
        <div className="auth-section">
          <p>Enter your sync token from the dashboard:</p>
          <input
            type="text"
            value={syncToken}
            onChange={(e) => setSyncToken(e.target.value)}
            placeholder="Sync token..."
            className="input"
          />
          <button onClick={saveSyncToken} className="btn btn-primary">
            Connect
          </button>
          <button onClick={openDashboard} className="btn btn-secondary">
            Open Dashboard
          </button>
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stat">
              <div className="stat-value">{stats.blockedToday}</div>
              <div className="stat-label">Blocked Today</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats.streak}</div>
              <div className="stat-label">Day Streak</div>
            </div>
          </div>

          <div className="toggle-section">
            <label className="toggle">
              <input
                type="checkbox"
                checked={preferences.focusModeEnabled}
                onChange={toggleFocusMode}
              />
              <span className="toggle-label">
                Focus Mode {preferences.focusModeEnabled ? 'ON' : 'OFF'}
              </span>
            </label>
          </div>

          <div className="section">
            <h3>Quick Add</h3>
            <div className="input-group">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="input"
              />
              <button onClick={addToWhitelist} className="btn btn-small">
                Allow
              </button>
              <button onClick={addToBlacklist} className="btn btn-small btn-danger">
                Block
              </button>
            </div>
          </div>

          <div className="section">
            <h3>Whitelist ({preferences.whitelist.length})</h3>
            <div className="domain-list">
              {preferences.whitelist.slice(0, 5).map((domain) => (
                <div key={domain} className="domain-item">
                  <span>{domain}</span>
                  <button
                    onClick={() => removeDomain('whitelist', domain)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
              {preferences.whitelist.length > 5 && (
                <div className="more">+{preferences.whitelist.length - 5} more</div>
              )}
            </div>
          </div>

          <div className="section">
            <h3>Blacklist ({preferences.blacklist.length})</h3>
            <div className="domain-list">
              {preferences.blacklist.slice(0, 5).map((domain) => (
                <div key={domain} className="domain-item">
                  <span>{domain}</span>
                  <button
                    onClick={() => removeDomain('blacklist', domain)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
              {preferences.blacklist.length > 5 && (
                <div className="more">+{preferences.blacklist.length - 5} more</div>
              )}
            </div>
          </div>

          <button onClick={openDashboard} className="btn btn-secondary full-width">
            View Full Dashboard
          </button>
        </>
      )}
    </div>
  );
};

export default Popup;
