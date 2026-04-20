import { useState } from 'react';
import { placeOrder } from '../api';

interface TradeFormProps {
  pair: string;
  onOrderPlaced?: () => void;
}

export default function TradeForm({ pair, onOrderPlaced }: TradeFormProps): JSX.Element {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('0');
  const [amount, setAmount] = useState('0');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setStatus(null);

    try {
      const result = await placeOrder({
        pair,
        side,
        price: Number(price),
        amount: Number(amount)
      });

      if (result.cfvWarning) {
        setStatus({ type: 'warning', message: `Order placed (${result.id.slice(0, 12)}…). Warning: ${result.cfvWarning}` });
      } else {
        setStatus({ type: 'success', message: `Order placed: ${result.id.slice(0, 12)}…` });
      }

      onOrderPlaced?.();
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to place order' });
    }
  };

  return (
    <form className="grid gap-2" onSubmit={handleSubmit}>
      <select className="rounded bg-slate-900 p-2" value={side} onChange={(e) => setSide(e.target.value as 'buy' | 'sell')}>
        <option value="buy">Buy</option>
        <option value="sell">Sell</option>
      </select>
      <input className="rounded bg-slate-900 p-2" value={price} type="number" min="0" step="0.00000001" onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
      <input className="rounded bg-slate-900 p-2" value={amount} type="number" min="0" step="0.00000001" onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
      <button className="rounded bg-accent px-3 py-2 font-medium text-slate-900" type="submit">
        Place Order
      </button>
      {status && (
        <p className={`text-sm ${
          status.type === 'success' ? 'text-emerald-400' :
          status.type === 'warning' ? 'text-amber-300' :
          'text-rose-400'
        }`}>
          {status.message}
        </p>
      )}
    </form>
  );
}
