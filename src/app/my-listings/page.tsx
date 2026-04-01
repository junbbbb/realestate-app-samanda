'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Spinner } from 'baseui/spinner';
import { Select, Value } from 'baseui/select';
import ListingCard from '@/components/ListingCard';
import { Listing } from '@/types/listing';

const STATUS_OPTIONS = [
  { label: '전체', id: '' },
  { label: '활성', id: 'active' },
  { label: '계약중', id: 'contracted' },
  { label: '완료', id: 'closed' },
];

export default function MyListingsPage() {
  const [css] = useStyletron();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Value>([]);

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadListings() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ source: 'manual', sortBy: 'date', sortOrder: 'desc', limit: '100' });
      const statusVal = statusFilter[0]?.id as string;
      if (statusVal) params.set('status', statusVal);
      const res = await fetch(`/api/listings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.data || []);
      }
    } catch (err) {
      console.error('My listings load error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={css({ padding: '20px', maxWidth: '600px', margin: '0 auto' })}>
      <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' })}>
        <h1 className={css({ fontSize: '24px', fontWeight: 700, margin: 0 })}>내 매물</h1>
        <Button onClick={() => router.push('/my-listings/new')} size="compact">
          + 매물 등록
        </Button>
      </div>

      <div className={css({ marginBottom: '16px', maxWidth: '200px' })}>
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={({ value }) => setStatusFilter(value)}
          placeholder="상태 필터"
          clearable={false}
          size="compact"
        />
      </div>

      {loading ? (
        <div className={css({ display: 'flex', justifyContent: 'center', padding: '40px' })}>
          <Spinner />
        </div>
      ) : (
        <div className={css({ display: 'flex', flexDirection: 'column', gap: '12px' })}>
          {listings.length > 0 ? (
            listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          ) : (
            <div className={css({ textAlign: 'center', padding: '60px 20px' })}>
              <p className={css({ color: '#888', marginBottom: '16px' })}>등록된 매물이 없습니다</p>
              <Button onClick={() => router.push('/my-listings/new')}>첫 매물 등록하기</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
