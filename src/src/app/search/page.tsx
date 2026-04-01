'use client';

import { useEffect, useState, useCallback } from 'react';
import { Select, Value } from 'baseui/select';
import { Input } from 'baseui/input';
import { Button } from 'baseui/button';
import { Spinner } from 'baseui/spinner';
import { FormControl } from 'baseui/form-control';
import { HeadingXLarge, LabelSmall } from 'baseui/typography';
import { Block } from 'baseui/block';
import { FlexGrid, FlexGridItem } from 'baseui/flex-grid';
import {
  TableBuilder,
  TableBuilderColumn,
} from 'baseui/table-semantic';
import { Tag, KIND, HIERARCHY } from 'baseui/tag';
import { Search, ChevronDown, ChevronUp } from 'baseui/icon';
import { StyledLink } from 'baseui/link';
import { Listing } from '@/types/listing';
import { useRouter } from 'next/navigation';
import { formatPrice, TYPE_LABEL, TRADE_LABEL, STATUS_LABEL, STATUS_KIND } from '@/components/ListingCard';
import { fetchLocalListings } from '@/lib/local-listings';

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
  const router = useRouter();
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

  const searchLocal = useCallback(
    (allListings: Listing[], searchPage: number) => {
      const typeVal = typeFilter[0]?.id as string;
      const tradeVal = tradeFilter[0]?.id as string;
      const sourceVal = sourceFilter[0]?.id as string;
      const sortVal = (sortFilter[0]?.id as string) || 'date';
      const limit = 20;

      let filtered = [...allListings];
      if (typeVal) filtered = filtered.filter((l) => l.type === typeVal);
      if (tradeVal) filtered = filtered.filter((l) => l.tradeType === tradeVal);
      if (sourceVal && sourceVal !== 'all') filtered = filtered.filter((l) => l.source === sourceVal);
      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = filtered.filter(
          (l) => l.address.toLowerCase().includes(kw) || (l.description || '').toLowerCase().includes(kw) || (l.addressDetail || '').toLowerCase().includes(kw)
        );
      }
      if (priceMin) filtered = filtered.filter((l) => l.price >= Number(priceMin));
      if (priceMax) filtered = filtered.filter((l) => l.price <= Number(priceMax));
      if (areaMin) filtered = filtered.filter((l) => l.area >= Number(areaMin));
      if (areaMax) filtered = filtered.filter((l) => l.area <= Number(areaMax));
      if (floorMin) filtered = filtered.filter((l) => (l.floor ?? 0) >= Number(floorMin));
      if (floorMax) filtered = filtered.filter((l) => (l.floor ?? 0) <= Number(floorMax));

      const sortOrder = sortVal === 'price' || sortVal === 'area' ? 'asc' : 'desc';
      filtered.sort((a, b) => {
        let cmp = 0;
        if (sortVal === 'price') cmp = a.price - b.price;
        else if (sortVal === 'area') cmp = a.area - b.area;
        else if (sortVal === 'floor') cmp = (a.floor ?? 0) - (b.floor ?? 0);
        else cmp = new Date(b.scrapedAt || b.createdAt).getTime() - new Date(a.scrapedAt || a.createdAt).getTime();
        return sortOrder === 'asc' ? cmp : -cmp;
      });

      const totalFiltered = filtered.length;
      const pages = Math.max(1, Math.ceil(totalFiltered / limit));
      const start = (searchPage - 1) * limit;
      setListings(filtered.slice(start, start + limit));
      setTotal(totalFiltered);
      setPage(searchPage);
      setTotalPages(pages);
    },
    [typeFilter, tradeFilter, sourceFilter, sortFilter, keyword, priceMin, priceMax, areaMin, areaMax, floorMin, floorMax]
  );

  const [allLocalListings, setAllLocalListings] = useState<Listing[]>([]);
  const [useLocal, setUseLocal] = useState(false);

  const search = useCallback(
    async (searchPage: number = 1) => {
      if (useLocal && allLocalListings.length > 0) {
        searchLocal(allLocalListings, searchPage);
        return;
      }
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
          if (data.data && data.data.length > 0) {
            setListings(data.data);
            setTotal(data.total || 0);
            setPage(data.page || 1);
            setTotalPages(data.totalPages || 1);
            setLoading(false);
            return;
          }
        }
        // Fallback to local
        const local = await fetchLocalListings();
        if (local.listings.length > 0) {
          setAllLocalListings(local.listings);
          setUseLocal(true);
          searchLocal(local.listings, searchPage);
        }
      } catch (err) {
        console.error('Search error:', err);
        try {
          const local = await fetchLocalListings();
          if (local.listings.length > 0) {
            setAllLocalListings(local.listings);
            setUseLocal(true);
            searchLocal(local.listings, searchPage);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    },
    [typeFilter, tradeFilter, sourceFilter, sortFilter, keyword, priceMin, priceMax, areaMin, areaMax, floorMin, floorMax, useLocal, allLocalListings, searchLocal]
  );

  useEffect(() => {
    search(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Block maxWidth="1200px">
      <HeadingXLarge marginTop="0" marginBottom="24px">
        매물 검색
      </HeadingXLarge>

      {/* Search Bar */}
      <Block display="flex" gridGap="12px" marginBottom="20px">
        <Block flex="1">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.currentTarget.value)}
            placeholder="주소, 설명 검색..."
            onKeyDown={(e) => e.key === 'Enter' && search(1)}
            startEnhancer={<Search size={18} />}
          />
        </Block>
        <Button onClick={() => search(1)}>검색</Button>
      </Block>

      {/* Quick Filters */}
      <FlexGrid flexGridColumnCount={4} flexGridColumnGap="12px" marginBottom="16px">
        <FlexGridItem>
          <FormControl label="유형">
            <Select
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={({ value }) => setTypeFilter(value)}
              placeholder="전체"
              clearable={false}
              size="compact"
            />
          </FormControl>
        </FlexGridItem>
        <FlexGridItem>
          <FormControl label="거래">
            <Select
              options={TRADE_OPTIONS}
              value={tradeFilter}
              onChange={({ value }) => setTradeFilter(value)}
              placeholder="전체"
              clearable={false}
              size="compact"
            />
          </FormControl>
        </FlexGridItem>
        <FlexGridItem>
          <FormControl label="출처">
            <Select
              options={SOURCE_OPTIONS}
              value={sourceFilter}
              onChange={({ value }) => setSourceFilter(value)}
              placeholder="전체"
              clearable={false}
              size="compact"
            />
          </FormControl>
        </FlexGridItem>
        <FlexGridItem>
          <FormControl label="정렬">
            <Select
              options={SORT_OPTIONS}
              value={sortFilter}
              onChange={({ value }) => {
                setSortFilter(value);
              }}
              clearable={false}
              size="compact"
            />
          </FormControl>
        </FlexGridItem>
      </FlexGrid>

      {/* Toggle Advanced Filters */}
      <Button
        onClick={() => setShowFilters(!showFilters)}
        kind="tertiary"
        size="compact"
        endEnhancer={() => showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        overrides={{ BaseButton: { style: { marginBottom: '16px' } } }}
      >
        {showFilters ? '필터 접기' : '상세 필터'}
      </Button>

      {showFilters && (
        <Block
          backgroundColor="white"
          padding="20px"
          marginBottom="20px"
          overrides={{
            Block: {
              style: {
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
              },
            },
          }}
        >
          <FlexGrid flexGridColumnCount={3} flexGridColumnGap="16px" flexGridRowGap="8px">
            <FlexGridItem>
              <FormControl label="가격 범위 (만원)">
                <Block display="flex" gridGap="8px" alignItems="center">
                  <Input value={priceMin} onChange={(e) => setPriceMin(e.currentTarget.value)} placeholder="최소" size="compact" type="number" />
                  <LabelSmall margin="0">~</LabelSmall>
                  <Input value={priceMax} onChange={(e) => setPriceMax(e.currentTarget.value)} placeholder="최대" size="compact" type="number" />
                </Block>
              </FormControl>
            </FlexGridItem>
            <FlexGridItem>
              <FormControl label="면적 범위 (㎡)">
                <Block display="flex" gridGap="8px" alignItems="center">
                  <Input value={areaMin} onChange={(e) => setAreaMin(e.currentTarget.value)} placeholder="최소" size="compact" type="number" />
                  <LabelSmall margin="0">~</LabelSmall>
                  <Input value={areaMax} onChange={(e) => setAreaMax(e.currentTarget.value)} placeholder="최대" size="compact" type="number" />
                </Block>
              </FormControl>
            </FlexGridItem>
            <FlexGridItem>
              <FormControl label="층수 범위">
                <Block display="flex" gridGap="8px" alignItems="center">
                  <Input value={floorMin} onChange={(e) => setFloorMin(e.currentTarget.value)} placeholder="최소" size="compact" type="number" />
                  <LabelSmall margin="0">~</LabelSmall>
                  <Input value={floorMax} onChange={(e) => setFloorMax(e.currentTarget.value)} placeholder="최대" size="compact" type="number" />
                </Block>
              </FormControl>
            </FlexGridItem>
          </FlexGrid>
          <Block marginTop="12px">
            <Button onClick={() => search(1)} size="compact">
              필터 적용
            </Button>
          </Block>
        </Block>
      )}

      {/* Results count */}
      <Block display="flex" justifyContent="space-between" alignItems="center" marginBottom="12px">
        <LabelSmall color="contentSecondary">총 {total}건</LabelSmall>
      </Block>

      {/* Table Results */}
      {loading ? (
        <Block display="flex" justifyContent="center" padding="40px">
          <Spinner />
        </Block>
      ) : listings.length > 0 ? (
        <TableBuilder
          data={listings}
          overrides={{
            Root: {
              style: {
                borderRadius: '8px',
                overflow: 'hidden',
              },
            },
            TableBodyRow: {
              style: {
                cursor: 'pointer',
                ':hover': { backgroundColor: '#f5f5f5' },
              },
              props: {
                onClick: (e: React.MouseEvent<HTMLTableRowElement>) => {
                  const row = (e.currentTarget as HTMLTableRowElement);
                  const id = row.dataset.id;
                  if (id) router.push(`/detail/${id}`);
                },
              },
            },
          }}
        >
          <TableBuilderColumn header="거래">
            {(listing: Listing) => (
              <Tag closeable={false} kind={listing.tradeType === 'sale' ? KIND.accent : KIND.warning} hierarchy={HIERARCHY.secondary}
                overrides={{ Root: { style: { marginLeft: 0 } } }}>
                {TRADE_LABEL[listing.tradeType]}
              </Tag>
            )}
          </TableBuilderColumn>
          <TableBuilderColumn header="유형">
            {(listing: Listing) => TYPE_LABEL[listing.type]}
          </TableBuilderColumn>
          <TableBuilderColumn header="주소">
            {(listing: Listing) => (
              <StyledLink
                href={`/detail/${listing.id}`}
                onClick={(e) => { e.preventDefault(); router.push(`/detail/${listing.id}`); }}
              >
                {listing.address}
              </StyledLink>
            )}
          </TableBuilderColumn>
          <TableBuilderColumn header="가격" numeric>
            {(listing: Listing) => formatPrice(listing.price)}
          </TableBuilderColumn>
          <TableBuilderColumn header="면적">
            {(listing: Listing) => `${listing.area}㎡`}
          </TableBuilderColumn>
          <TableBuilderColumn header="층">
            {(listing: Listing) =>
              listing.floor !== undefined && listing.floor !== null
                ? `${listing.floor}층${listing.totalFloors ? `/${listing.totalFloors}층` : ''}`
                : '-'
            }
          </TableBuilderColumn>
          <TableBuilderColumn header="출처">
            {(listing: Listing) =>
              listing.source === 'naver' ? (
                <Tag closeable={false} kind={KIND.positive} hierarchy={HIERARCHY.secondary}
                  overrides={{ Root: { style: { marginLeft: 0 } } }}>
                  네이버
                </Tag>
              ) : '직접'
            }
          </TableBuilderColumn>
          <TableBuilderColumn header="상태">
            {(listing: Listing) => (
              <Tag closeable={false} kind={STATUS_KIND[listing.status]} hierarchy={HIERARCHY.primary}
                overrides={{ Root: { style: { marginLeft: 0 } } }}>
                {STATUS_LABEL[listing.status]}
              </Tag>
            )}
          </TableBuilderColumn>
        </TableBuilder>
      ) : (
        <LabelSmall color="contentSecondary" $style={{ textAlign: 'center', padding: '40px 0' }}>
          검색 결과가 없습니다
        </LabelSmall>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Block display="flex" justifyContent="center" gridGap="8px" marginTop="24px" alignItems="center">
          <Button onClick={() => search(page - 1)} disabled={page <= 1} size="compact" kind="secondary">
            이전
          </Button>
          <LabelSmall>{page} / {totalPages}</LabelSmall>
          <Button onClick={() => search(page + 1)} disabled={page >= totalPages} size="compact" kind="secondary">
            다음
          </Button>
        </Block>
      )}
    </Block>
  );
}
