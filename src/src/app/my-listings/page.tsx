'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'baseui/button';
import { Spinner } from 'baseui/spinner';
import { Select, Value } from 'baseui/select';
import { HeadingXLarge, LabelSmall } from 'baseui/typography';
import { Block } from 'baseui/block';
import { FormControl } from 'baseui/form-control';
import { Tag, KIND, HIERARCHY } from 'baseui/tag';
import {
  TableBuilder,
  TableBuilderColumn,
} from 'baseui/table-semantic';
import { Plus } from 'baseui/icon';
import { StyledLink } from 'baseui/link';
import { Listing } from '@/types/listing';
import { formatPrice, TYPE_LABEL, TRADE_LABEL, STATUS_LABEL, STATUS_KIND } from '@/components/ListingCard';

const STATUS_OPTIONS = [
  { label: '전체', id: '' },
  { label: '활성', id: 'active' },
  { label: '계약중', id: 'contracted' },
  { label: '완료', id: 'closed' },
];

export default function MyListingsPage() {
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
    <Block maxWidth="1200px">
      <Block display="flex" justifyContent="space-between" alignItems="center" marginBottom="24px">
        <HeadingXLarge margin="0">내 매물</HeadingXLarge>
        <Button
          onClick={() => router.push('/my-listings/new')}
          startEnhancer={() => <Plus size={18} />}
        >
          매물 등록
        </Button>
      </Block>

      <Block marginBottom="20px" width="200px">
        <FormControl label="상태 필터">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={({ value }) => setStatusFilter(value)}
            placeholder="전체"
            clearable={false}
            size="compact"
          />
        </FormControl>
      </Block>

      {loading ? (
        <Block display="flex" justifyContent="center" padding="40px">
          <Spinner />
        </Block>
      ) : listings.length > 0 ? (
        <TableBuilder
          data={listings}
          overrides={{
            Root: {
              style: { borderRadius: '8px', overflow: 'hidden' },
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
                ? `${listing.floor}층`
                : '-'
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
          <TableBuilderColumn header="">
            {(listing: Listing) => (
              <Block display="flex" gridGap="4px">
                <Button size="mini" kind="secondary" onClick={() => router.push(`/my-listings/edit/${listing.id}`)}>
                  수정
                </Button>
                <Button size="mini" kind="secondary" onClick={() => router.push(`/detail/${listing.id}`)}>
                  상세
                </Button>
              </Block>
            )}
          </TableBuilderColumn>
        </TableBuilder>
      ) : (
        <Block $style={{ textAlign: 'center', padding: '60px 20px' }}>
          <LabelSmall color="contentSecondary" marginBottom="16px">
            등록된 매물이 없습니다
          </LabelSmall>
          <Button onClick={() => router.push('/my-listings/new')}>첫 매물 등록하기</Button>
        </Block>
      )}
    </Block>
  );
}
