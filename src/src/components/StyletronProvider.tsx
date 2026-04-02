'use client';

import { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { Provider as StyletronProvider } from 'styletron-react';
import { Client as Styletron, Server } from 'styletron-engine-monolithic';
import { BaseProvider, createTheme, type Theme } from 'baseui';

const FONT_FAMILY =
  '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';

const baseTheme = createTheme({
  primaryFontFamily: FONT_FAMILY,
});

// baseui의 createTheme이 primaryFontFamily를 typography에 반영하지 않으므로 직접 override
const typographyOverrides: Theme['typography'] = { ...baseTheme.typography };
for (const key of Object.keys(typographyOverrides) as Array<keyof Theme['typography']>) {
  const entry = typographyOverrides[key];
  if (entry && typeof entry === 'object' && 'fontFamily' in entry) {
    (entry as { fontFamily: string }).fontFamily = FONT_FAMILY;
  }
}

const theme: Theme = {
  ...baseTheme,
  typography: typographyOverrides,
};

export default function AppStyletronProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [engine] = useState(() =>
    typeof document !== 'undefined' ? new Styletron() : new Server()
  );

  useServerInsertedHTML(() => {
    if (engine instanceof Server) {
      const stylesheets = engine.getStylesheets();
      if (stylesheets.length === 0) return null;
      return (
        <>
          {stylesheets.map((sheet, i) => (
            <style
              className="_styletron_hydrate_"
              dangerouslySetInnerHTML={{ __html: sheet.css }}
              media={sheet.attrs.media}
              data-hydrate={sheet.attrs['data-hydrate']}
              key={i}
            />
          ))}
        </>
      );
    }
    return null;
  });

  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={theme}>{children}</BaseProvider>
    </StyletronProvider>
  );
}
