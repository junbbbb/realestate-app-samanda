'use client';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Navigation } from 'baseui/side-navigation';
import { HeadingSmall, LabelSmall } from 'baseui/typography';
import { Block } from 'baseui/block';
import { MdDashboard, MdSearch, MdListAlt } from 'react-icons/md';

const NAV_ITEMS = [
  { title: '대시보드', itemId: '/', icon: <MdDashboard size={20} /> },
  { title: '매물 검색', itemId: '/search', icon: <MdSearch size={20} /> },
  { title: '내 매물', itemId: '/my-listings', icon: <MdListAlt size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const activeItemId =
    NAV_ITEMS.find(
      (item) =>
        item.itemId === pathname ||
        (item.itemId !== '/' && pathname.startsWith(item.itemId))
    )?.itemId || '/';

  return (
    <Block
      as="nav"
      overrides={{
        Block: {
          style: {
            width: '240px',
            minWidth: '240px',
            height: '100vh',
            position: 'fixed',
            top: '0',
            left: '0',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 10,
          },
        },
      }}
    >
      <Block
        padding="24px 20px 16px"
        display="flex"
        alignItems="center"
      >
        <HeadingSmall margin="0">이모님 부동산</HeadingSmall>
      </Block>

      <Navigation
        items={NAV_ITEMS.map((item) => ({
          title: (
            <Block display="flex" alignItems="center" gridGap="10px">
              {item.icon}
              <LabelSmall margin="0">{item.title}</LabelSmall>
            </Block>
          ),
          itemId: item.itemId,
        }))}
        activeItemId={activeItemId}
        onChange={({ event, item }) => {
          event.preventDefault();
          router.push(item.itemId as string);
        }}
        overrides={{
          NavItem: {
            style: ({ $active }) => ({
              paddingTop: '12px',
              paddingBottom: '12px',
              fontWeight: $active ? 600 : 400,
            }),
          },
        }}
      />
    </Block>
  );
}
