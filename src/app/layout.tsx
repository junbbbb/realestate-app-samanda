import type { Metadata } from 'next';
import StyletronProvider from '@/components/StyletronProvider';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: '이모님 부동산',
  description: '마포구 상가/건물 매물 관리',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#f8f9fa',
        }}
      >
        <StyletronProvider>
          <main style={{ paddingBottom: '80px', minHeight: '100vh' }}>
            {children}
          </main>
          <Navigation />
        </StyletronProvider>
      </body>
    </html>
  );
}
