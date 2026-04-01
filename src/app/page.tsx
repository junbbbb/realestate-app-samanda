'use client';

import { useEffect, useState } from 'react';
import { useStyletron } from 'baseui';
import { Spinner } from 'baseui/spinner';
import ListingCard from '@/components/ListingCard';
import { Listing } from '@/types/listing';

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
  const [css] = useStyletron();
  return (
    <div
      className={css({
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e0e0e0',
      })}
    >
      <p className={css({ fontSize: '13px', color: '#888', margin: '0 0 4px 0' })}>
        {label}
      </p>
      <p className={css({ fontSize: '28px', fontWeight: 700, color, margin: 0 })}>
        {value}
        <span className={css({ fontSize: '14px', fontWeight: 400, marginLeft: '4px' })}>
          {unit}
        </span>
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [css] = useStyletron();
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
        if (statsRes.ok) setStats(await statsRes.json());
        if (listingsRes.ok) {
          const data = await listingsRes.json();
          setRecentListings(data.data || []);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div
        className={css({
          display: 'flex',
          justifyContent: 'center',
          padding: '60px',
        })}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <div className={css({ padding: '20px', maxWidth: '600px', margin: '0 auto' })}>
      <h1 className={css({ fontSize: '24px', fontWeight: 700, marginBottom: '20px' })}>
        이모님 부동산
      </h1>

      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '24px',
        })}
      >
        <StatCard label="오늘 신규 매물" value={stats?.todayNew ?? 0} unit="건" color="#1565c0" />
        <StatCard label="내 활성 매물" value={stats?.activeManual ?? 0} unit="건" color="#2e7d32" />
        <StatCard label="계약 진행중" value={stats?.contractedManual ?? 0} unit="건" color="#ed6c02" />
        <StatCard label="거래 완료" value={stats?.closedManual ?? 0} unit="건" color="#9e9e9e" />
      </div>

      {stats?.lastScrapedAt && (
        <p className={css({ fontSize: '13px', color: '#888', marginBottom: '20px' })}>
          마지막 수집: {new Date(stats.lastScrapedAt).toLocaleString('ko-KR')}
        </p>
      )}

      <h2 className={css({ fontSize: '18px', fontWeight: 600, marginBottom: '12px' })}>
        최근 매물
      </h2>
      <div className={css({ display: 'flex', flexDirection: 'column', gap: '12px' })}>
        {recentListings.length > 0 ? (
          recentListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <p className={css({ color: '#888', textAlign: 'center', padding: '40px 0' })}>
            아직 수집된 매물이 없습니다
          </p>
        )}
      </div>
    </div>
  );
}
