import { Suspense } from 'react';
import TrackingClient from './TrackingClient';

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="container min-h-[65vh] py-16">
          <div className="mx-auto max-w-xl">
            <p className="eyebrow">ORDER STATUS</p>
            <h1 className="mt-3 text-3xl font-black text-[#12345b]">Lacak Pesanan</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Memuat...</p>
          </div>
        </main>
      }
    >
      <TrackingClient />
    </Suspense>
  );
}
