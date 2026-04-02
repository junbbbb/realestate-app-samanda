import type { Metadata } from 'next';
import './globals.css';
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
      <head></head>
      <body>
        <StyletronProvider>
          <Sidebar />
          <LayoutMain>{children}</LayoutMain>
        </StyletronProvider>
      </body>
    </html>
  );
}
