import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../api';

export default function Settings(): JSX.Element {
  const [bootstrap, setBootstrap] = useState('/dns4/bootstrap.cfvdex.local/tcp/4001/p2p/peer-id');
  const [cfvUrl, setCfvUrl] = useState('http://localhost:3001');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings.bootstrapNode) setBootstrap(settings.bootstrapNode);
      if (settings.cfvAgentUrl) setCfvUrl(settings.cfvAgentUrl);
    }).catch(() => setError('Failed to load settings'));
  }, []);

  const handleSave = async (): Promise<void> => {
    setError(null);
    try {
      await saveSettings({
        bootstrapNode: bootstrap,
        cfvAgentUrl: cfvUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save settings');
    }
  };

  return (
    <div className="grid gap-4">
      <label className="grid gap-2">
        <span>Bootstrap Node</span>
        <input className="rounded bg-slate-900 p-2" value={bootstrap} onChange={(event) => setBootstrap(event.target.value)} />
      </label>
      <label className="grid gap-2">
        <span>CFV Agent URL</span>
        <input className="rounded bg-slate-900 p-2" value={cfvUrl} onChange={(event) => setCfvUrl(event.target.value)} />
      </label>
      <button
        className="rounded bg-accent px-3 py-2 font-medium text-slate-900"
        onClick={handleSave}
      >
        Save Settings
      </button>
      {saved && <p className="text-sm text-emerald-400">Settings saved!</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
