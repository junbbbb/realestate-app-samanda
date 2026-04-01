'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStyletron } from 'baseui';

const NAV_ITEMS = [
  { href: '/', label: '대시보드', icon: '🏠' },
  { href: '/search', label: '매물 검색', icon: '🔍' },
  { href: '/my-listings', label: '내 매물', icon: '📋' },
];

export default function Navigation() {
  const [css, theme] = useStyletron();
  const pathname = usePathname();

  return (
    <nav
      className={css({
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e0e0e0',
        paddingTop: '8px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        zIndex: 100,
      })}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={css({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: isActive ? theme.colors.primary : '#888888',
              fontSize: '12px',
              gap: '2px',
              flex: 1,
            })}
          >
            <span className={css({ fontSize: '24px' })}>{item.icon}</span>
            <span className={css({ fontWeight: isActive ? 600 : 400 })}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
