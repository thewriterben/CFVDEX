import Panel from '../components/Panel';
import Settings from '../components/Settings';

export default function SettingsPage(): JSX.Element {
  return (
    <div className="grid gap-4">
      <Panel>
        <h2 className="mb-3 text-lg font-semibold">Settings</h2>
        <Settings />
      </Panel>
    </div>
  );
}
