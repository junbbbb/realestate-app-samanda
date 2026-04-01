'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStyletron } from 'baseui';
import { Select, Value } from 'baseui/select';
import { Input } from 'baseui/input';
import { Button } from 'baseui/button';
import { Spinner } from 'baseui/spinner';
import ListingCard from '@/components/ListingCard';
import { Listing } from '@/types/listing';
const TYPE_OPTIONS = [
  { label: '전체', id: '' },
  { label: '상가', id: 'store' },
  { label: '건물', id: 'building' },
];

const TRADE_OPTIONS = [
  { label: '전체', id: '' },
  { label: '매매', id: 'sale' },
  { label: '임대', id: 'lease' },
];

const SOURCE_OPTIONS = [
  { label: '전체', id: 'all' },
  { label: '네이버', id: 'naver' },
  { label: '직접 등록', id: 'manual' },
];

const SORT_OPTIONS = [
  { label: '최신순', id: 'date' },
  { label: '가격순', id: 'price' },
  { label: '면적순', id: 'area' },
  { label: '층순', id: 'floor' },
];

export default function SearchPage() {
  const [css] = useStyletron();
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [typeFilter, setTypeFilter] = useState<Value>([]);
  const [tradeFilter, setTradeFilter] = useState<Value>([]);
  const [sourceFilter, setSourceFilter] = useState<Value>([]);
  const [sortFilter, setSortFilter] = useState<Value>([{ label: '최신순', id: 'date' }]);
  const [keyword, setKeyword] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [areaMin, setAreaMin] = useState('');
  const [areaMax, setAreaMax] = useState('');
  const [floorMin, setFloorMin] = useState('');
  const [floorMax, setFloorMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const search = useCallback(
    async (searchPage: number = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const typeVal = typeFilter[0]?.id as string;
        const tradeVal = tradeFilter[0]?.id as string;
        const sourceVal = sourceFilter[0]?.id as string;
        const sortVal = sortFilter[0]?.id as string;

        if (typeVal) params.set('type', typeVal);
        if (tradeVal) params.set('tradeType', tradeVal);
        if (sourceVal && sourceVal !== 'all') params.set('source', sourceVal);
        if (sortVal) params.set('sortBy', sortVal);
        params.set('sortOrder', sortVal === 'price' || sortVal === 'area' ? 'asc' : 'desc');
        if (keyword) params.set('keyword', keyword);
        if (priceMin) params.set('priceMin', priceMin);
        if (priceMax) params.set('priceMax', priceMax);
        if (areaMin) params.set('areaMin', areaMin);
        if (areaMax) params.set('areaMax', areaMax);
        if (floorMin) params.set('floorMin', floorMin);
        if (floorMax) params.set('floorMax', floorMax);
        params.set('page', String(searchPage));
        params.set('limit', '20');

        const res = await fetch(`/api/listings?${params}`);
        if (res.ok) {
          const data = await res.json();
          setListings(data.data || []);
          setTotal(data.total || 0);
          setPage(data.page || 1);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    },
    [typeFilter, tradeFilter, sourceFilter, sortFilter, keyword, priceMin, priceMax, areaMin, areaMax, floorMin, floorMax]
  );

  useEffect(() => {
    search(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={css({ padding: '20px', maxWidth: '600px', margin: '0 auto' })}>
      <h1 className={css({ fontSize: '24px', fontWeight: 700, marginBottom: '16px' })}>
        매물 검색
      </h1>

      {/* Search Bar */}
      <div className={css({ display: 'flex', gap: '8px', marginBottom: '12px' })}>
        <div className={css({ flex: 1 })}>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.currentTarget.value)}
            placeholder="주소, 설명 검색..."
            onKeyDown={(e) => e.key === 'Enter' && search(1)}
          />
        </div>
        <Button onClick={() => search(1)}>검색</Button>
      </div>

      {/* Quick Filters */}
      <div className={css({ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' })}>
        <div className={css({ flex: '1 1 100px', minWidth: '100px' })}>
          <Select
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={({ value }) => setTypeFilter(value)}
            placeholder="유형"
            clearable={false}
            size="compact"
          />
        </div>
        <div className={css({ flex: '1 1 100px', minWidth: '100px' })}>
          <Select
            options={TRADE_OPTIONS}
            value={tradeFilter}
            onChange={({ value }) => setTradeFilter(value)}
            placeholder="거래"
            clearable={false}
            size="compact"
          />
        </div>
        <div className={css({ flex: '1 1 100px', minWidth: '100px' })}>
          <Select
            options={SOURCE_OPTIONS}
            value={sourceFilter}
            onChange={({ value }) => setSourceFilter(value)}
            placeholder="출처"
            clearable={false}
            size="compact"
          />
        </div>
      </div>

      {/* Toggle Advanced Filters */}
      <Button
        onClick={() => setShowFilters(!showFilters)}
        kind="tertiary"
        size="compact"
        overrides={{ BaseButton: { style: { marginBottom: '12px' } } }}
      >
        {showFilters ? '필터 접기 ▲' : '상세 필터 ▼'}
      </Button>

      {showFilters && (
        <div
          className={css({
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e0e0e0',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          })}
        >
          <div>
            <label className={css({ fontSize: '13px', color: '#666', marginBottom: '4px', display: 'block' })}>
              가격 범위 (만원)
            </label>
            <div className={css({ display: 'flex', gap: '8px', alignItems: 'center' })}>
              <Input value={priceMin} onChange={(e) => setPriceMin(e.currentTarget.value)} placeholder="최소" size="compact" type="number" />
              <span>~</span>
              <Input value={priceMax} onChange={(e) => setPriceMax(e.currentTarget.value)} placeholder="최대" size="compact" type="number" />
            </div>
          </div>
          <div>
            <label className={css({ fontSize: '13px', color: '#666', marginBottom: '4px', display: 'block' })}>
              면적 범위 (㎡)
            </label>
            <div className={css({ display: 'flex', gap: '8px', alignItems: 'center' })}>
              <Input value={areaMin} onChange={(e) => setAreaMin(e.currentTarget.value)} placeholder="최소" size="compact" type="number" />
              <span>~</span>
              <Input value={areaMax} onChange={(e) => setAreaMax(e.currentTarget.value)} placeholder="최대" size="compact" type="number" />
            </div>
          </div>
          <div>
            <label className={css({ fontSize: '13px', color: '#666', marginBottom: '4px', display: 'block' })}>
              층수 범위
            </label>
            <div className={css({ display: 'flex', gap: '8px', alignItems: 'center' })}>
              <Input value={floorMin} onChange={(e) => setFloorMin(e.currentTarget.value)} placeholder="최소" size="compact" type="number" />
              <span>~</span>
              <Input value={floorMax} onChange={(e) => setFloorMax(e.currentTarget.value)} placeholder="최대" size="compact" type="number" />
            </div>
          </div>
          <Button onClick={() => search(1)} size="compact">
            필터 적용
          </Button>
        </div>
      )}

      {/* Sort */}
      <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' })}>
        <span className={css({ fontSize: '14px', color: '#666' })}>
          총 {total}건
        </span>
        <div className={css({ width: '140px' })}>
          <Select
            options={SORT_OPTIONS}
            value={sortFilter}
            onChange={({ value }) => {
              setSortFilter(value);
              search(1);
            }}
            clearable={false}
            size="compact"
          />
        </div>
      </div>

      {/* Results */}
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
            <p className={css({ color: '#888', textAlign: 'center', padding: '40px 0' })}>
              검색 결과가 없습니다
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={css({ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' })}>
          <Button onClick={() => search(page - 1)} disabled={page <= 1} size="compact" kind="secondary">
            이전
          </Button>
          <span className={css({ display: 'flex', alignItems: 'center', fontSize: '14px' })}>
            {page} / {totalPages}
          </span>
          <Button onClick={() => search(page + 1)} disabled={page >= totalPages} size="compact" kind="secondary">
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
