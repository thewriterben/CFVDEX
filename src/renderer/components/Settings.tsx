import { useState } from 'react';

export default function Settings(): JSX.Element {
  const [autoStart, setAutoStart] = useState(true);
  const [bootstrap, setBootstrap] = useState('/dns4/bootstrap.cfvdex.local/tcp/4001/p2p/peer-id');
  const [cfvUrl, setCfvUrl] = useState('http://localhost:3001');

  return (
    <div className="grid gap-4">
      <label className="flex items-center gap-2">
        <input checked={autoStart} type="checkbox" onChange={(event) => setAutoStart(event.target.checked)} />
        Auto-start node on OS startup
      </label>
      <label className="grid gap-2">
        <span>Bootstrap Node</span>
        <input className="rounded bg-slate-900 p-2" value={bootstrap} onChange={(event) => setBootstrap(event.target.value)} />
      </label>
      <label className="grid gap-2">
        <span>CFV Agent URL</span>
        <input className="rounded bg-slate-900 p-2" value={cfvUrl} onChange={(event) => setCfvUrl(event.target.value)} />
      </label>
    </div>
  );
}
