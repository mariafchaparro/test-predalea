'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode, useEffect, useState } from 'react';

export function TonProvider({ children }: { children: ReactNode }) {
  const [manifestUrl, setManifestUrl] = useState('');

  useEffect(() => {
    // Genera automáticamente la URL basándose en tu entorno actual (ngrok, vercel real, etc.)
    setManifestUrl(`${window.location.origin}/tonconnect-manifest.json`);
  }, []);

  if (!manifestUrl) return null;

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
