'use client';

import { useEffect, useState } from 'react';
import { Spinner } from 'baseui/spinner';
import { Card, StyledBody } from 'baseui/card';
import { HeadingXLarge, HeadingSmall, LabelSmall, DisplayMedium } from 'baseui/typography';
import { Block } from 'baseui/block';
import { FlexGrid, FlexGridItem } from 'baseui/flex-grid';
import ListingCard from '@/components/ListingCard';
import { Listing } from '@/types/listing';
import { fetchLocalListings } from '@/lib/local-listings';

interface Stats {
  todayNew: number;
  activeManual: number;
  contractedManual: number;
  closedManual: number;
  lastScrapedAt: string | null;
}

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <Card
      overrides={{
        Root: {
          style: {
            borderRadius: '8px',
          },
        },
      }}
    >
      <StyledBody>
        <LabelSmall color="contentSecondary" marginBottom="4px">
          {label}
        </LabelSmall>
        <DisplayMedium
          overrides={{
            Block: {
              style: { color, fontSize: '32px', lineHeight: '1.2' },
            },
          }}
        >
          {value}
          <LabelSmall
            overrides={{
              Block: {
                style: {
                  display: 'inline',
                  marginLeft: '4px',
                  fontWeight: 400,
                  color: '#666',
                },
              },
            }}
          >
            {unit}
          </LabelSmall>
        </DisplayMedium>
      </StyledBody>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, listingsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/listings?sortBy=date&sortOrder=desc&limit=5'),
        ]);
        let statsOk = false;
        if (statsRes.ok) {
          const s = await statsRes.json();
          if (s && !s.error) { setStats(s); statsOk = true; }
        }
        let listingsOk = false;
        if (listingsRes.ok) {
          const data = await listingsRes.json();
          if (data.data && data.data.length > 0) {
            setRecentListings(data.data);
            listingsOk = true;
          }
        }
        if (!statsOk || !listingsOk) {
          const local = await fetchLocalListings();
          if (local.listings.length > 0) {
            if (!statsOk) {
              const today = new Date().toDateString();
              const todayNew = local.listings.filter(
                (l) => new Date(l.scrapedAt || '').toDateString() === today
              ).length;
              setStats({
                todayNew,
                activeManual: 0,
                contractedManual: 0,
                closedManual: 0,
                lastScrapedAt: local.scrapedAt,
              });
            }
            if (!listingsOk) {
              setRecentListings(local.listings.slice(0, 5));
            }
          }
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        try {
          const local = await fetchLocalListings();
          if (local.listings.length > 0) {
            const today = new Date().toDateString();
            const todayNew = local.listings.filter(
              (l) => new Date(l.scrapedAt || '').toDateString() === today
            ).length;
            setStats({
              todayNew,
              activeManual: 0,
              contractedManual: 0,
              closedManual: 0,
              lastScrapedAt: local.scrapedAt,
            });
            setRecentListings(local.listings.slice(0, 5));
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <Block display="flex" justifyContent="center" padding="60px">
        <Spinner />
      </Block>
    );
  }

  return (
    <Block maxWidth="1000px">
      <HeadingXLarge marginTop="0" marginBottom="24px">
        대시보드
      </HeadingXLarge>

      <FlexGrid
        flexGridColumnCount={4}
        flexGridColumnGap="16px"
        flexGridRowGap="16px"
        marginBottom="32px"
      >
        <FlexGridItem>
          <StatCard label="오늘 신규 매물" value={stats?.todayNew ?? 0} unit="건" color="#1565c0" />
        </FlexGridItem>
        <FlexGridItem>
          <StatCard label="내 활성 매물" value={stats?.activeManual ?? 0} unit="건" color="#2e7d32" />
        </FlexGridItem>
        <FlexGridItem>
          <StatCard label="계약 진행중" value={stats?.contractedManual ?? 0} unit="건" color="#ed6c02" />
        </FlexGridItem>
        <FlexGridItem>
          <StatCard label="거래 완료" value={stats?.closedManual ?? 0} unit="건" color="#9e9e9e" />
        </FlexGridItem>
      </FlexGrid>

      {stats?.lastScrapedAt && (
        <LabelSmall color="contentSecondary" marginBottom="24px">
          마지막 수집: {new Date(stats.lastScrapedAt).toLocaleString('ko-KR')}
        </LabelSmall>
      )}

      <HeadingSmall marginBottom="16px">최근 매물</HeadingSmall>
      <Block display="flex" flexDirection="column" gridGap="12px">
        {recentListings.length > 0 ? (
          recentListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <LabelSmall color="contentSecondary" $style={{ textAlign: 'center', padding: '40px 0' }}>
            아직 수집된 매물이 없습니다
          </LabelSmall>
        )}
      </Block>
    </Block>
  );
}
