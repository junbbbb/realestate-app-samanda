import type { Metadata } from 'next';
import StyletronProvider from '@/components/StyletronProvider';
import Sidebar from '@/components/Navigation';
import LayoutMain from '@/components/LayoutMain';

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
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          @font-face {
            font-family: 'Pretendard Variable';
            font-weight: 45 920;
            font-style: normal;
            font-display: swap;
            src: url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2') format('woff2-variations');
          }
        `}} />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily:
            '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", sans-serif',
          backgroundColor: '#f8f9fa',
          minWidth: '1280px',
        }}
      >
        <StyletronProvider>
          <Sidebar />
          <LayoutMain>{children}</LayoutMain>
        </StyletronProvider>
      </body>
    </html>
  );
}
