import type { PropsWithChildren } from 'react';

export default function Panel({ children }: PropsWithChildren): JSX.Element {
  return <section className="rounded border border-slate-800 bg-panel p-4">{children}</section>;
}
