'use client';

import { useRef } from 'react';
import { Provider as StyletronProvider } from 'styletron-react';
import { Client as Styletron, Server } from 'styletron-engine-monolithic';
import { BaseProvider, createTheme } from 'baseui';

const FONT_FAMILY =
  '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';

const theme = createTheme({
  primaryFontFamily: FONT_FAMILY,
});

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
      <BaseProvider theme={theme}>{children}</BaseProvider>
    </StyletronProvider>
  );
}
