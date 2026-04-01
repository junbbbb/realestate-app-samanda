'use client';

import { useRef } from 'react';
import { Provider as StyletronProvider } from 'styletron-react';
import { Client as Styletron, Server } from 'styletron-engine-monolithic';
import { LightTheme, BaseProvider } from 'baseui';

export default function AppStyletronProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const engineRef = useRef<Styletron | Server | null>(null);
  if (!engineRef.current) {
    engineRef.current =
      typeof document !== 'undefined' ? new Styletron() : new Server();
  }

  return (
    <StyletronProvider value={engineRef.current}>
      <BaseProvider theme={LightTheme}>{children}</BaseProvider>
    </StyletronProvider>
  );
}
