'use client';

import { useTonConnectUI, TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { ReactNode, useEffect, useState } from 'react';

export function WalletGuard({ children }: { children: ReactNode }) {
  const wallet = useTonWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-[3px] border-slate-100 border-t-[#2e5cff] rounded-full animate-spin" />
    </div>
  );

  if (!wallet) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
        <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-[#2e5cff] to-[#165a92] flex items-center justify-center mb-8 shadow-xl shadow-blue-100">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 mb-3 text-center">Predalea</h1>
        <p className="text-slate-500 text-center mb-10 max-w-[280px] leading-relaxed">
          Conecta tu wallet de TON para empezar a participar en los mercados de predicción.
        </p>

        <div className="w-full flex justify-center">
          <TonConnectButton />
        </div>

        <p className="mt-12 text-xs text-slate-400 font-medium uppercase tracking-wider">
          Powered by TON Connect
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
