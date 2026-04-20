import { Link, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import TradePage from './pages/TradePage';
import WalletPage from './pages/WalletPage';
import HistoryPage from './pages/HistoryPage';
import PeersPage from './pages/PeersPage';
import SettingsPage from './pages/SettingsPage';

const links = [
  ['/', 'Dashboard'],
  ['/trade', 'Trade'],
  ['/wallet', 'Wallet'],
  ['/history', 'History'],
  ['/peers', 'Peers'],
  ['/settings', 'Settings']
] as const;

export default function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-bg text-slate-100">
      <header className="border-b border-slate-700 px-5 py-4">
        <h1 className="text-2xl font-semibold text-accent">CFVDEX</h1>
      </header>
      <nav className="flex flex-wrap gap-2 border-b border-slate-800 px-5 py-3">
        {links.map(([to, label]) => (
          <Link key={to} className="rounded bg-panel px-3 py-2 text-sm hover:bg-slate-700" to={to}>
            {label}
          </Link>
        ))}
      </nav>
      <main className="p-5">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/trade" element={<TradePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/peers" element={<PeersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
