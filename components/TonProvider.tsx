'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode } from 'react';

export function TonProvider({ children }: { children: ReactNode }) {
  // En Next.js, necesitamos asegurarnos de que la URL sea absoluta o relativa al root
  // Para pruebas locale, Ton Connect a veces requiere una URL accesible o un manifest vÃ¡lido.
  const manifestUrl = 'https://predalea-test.vercel.app/tonconnect-manifest.json';

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        twaReturnUrl: 'https://t.me/predalea_bot/start'
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
