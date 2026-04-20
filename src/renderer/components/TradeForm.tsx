import { useState } from 'react';

interface TradeFormProps {
  pair: string;
}

export default function TradeForm({ pair }: TradeFormProps): JSX.Element {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('0');
  const [amount, setAmount] = useState('0');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await window.cfvdex.placeOrder({
      pair,
      side,
      price: Number(price),
      amount: Number(amount)
    });
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
    </form>
  );
}
