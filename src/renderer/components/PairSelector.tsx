import { getPairs } from '@shared/constants';

interface PairSelectorProps {
  pair: string;
  onChange: (pair: string) => void;
}

export default function PairSelector({ pair, onChange }: PairSelectorProps): JSX.Element {
  return (
    <select
      className="w-full rounded bg-slate-900 p-2"
      value={pair}
      onChange={(event) => onChange(event.target.value)}
    >
      {getPairs().map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}
