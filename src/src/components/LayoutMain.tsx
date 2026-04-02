'use client';

import { useStyletron } from 'baseui';

export default function LayoutMain({ children }: { children: React.ReactNode }) {
  const [css, theme] = useStyletron();

  return (
    <main
      className={css({
        marginLeft: '240px',
        minHeight: '100vh',
        padding: '32px 40px',
        backgroundColor: theme.colors.backgroundPrimary,
      })}
    >
      {children}
    </main>
  );
}
