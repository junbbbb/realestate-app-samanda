'use client';

import { useEffect, useState } from 'react';
import { useStyletron } from 'baseui';
import { Spinner } from 'baseui/spinner';
import { HeadingXLarge, LabelSmall } from 'baseui/typography';
import { Block } from 'baseui/block';
import {
  TableBuilder,
  TableBuilderColumn,
} from 'baseui/table-semantic';
import { Tag, KIND, HIERARCHY } from 'baseui/tag';
import { StyledLink } from 'baseui/link';
import { Listing } from '@/types/listing';
import { useRouter } from 'next/navigation';
import { formatPrice, TYPE_LABEL, TRADE_LABEL, STATUS_LABEL, STATUS_KIND } from '@/components/ListingCard';
import { fetchLocalListings } from '@/lib/local-listings';
import { useFavorites } from '@/lib/favorites';
import { AiFillStar } from 'react-icons/ai';

export default function FavoritesPage() {
  const [, theme] = useStyletron();
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/listings?limit=1000');
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            setAllListings(data.data);
            setLoading(false);
            return;
          }
        }
      } catch {}
      try {
        const local = await fetchLocalListings();
        if (local.listings.length > 0) {
          setAllListings(local.listings);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const favoriteListings = allListings.filter((l) => favorites.includes(l.id));

  return (
    <Block maxWidth="1200px">
      <HeadingXLarge marginTop="0" marginBottom="24px">
        즐겨찾기
      </HeadingXLarge>

      <LabelSmall color="contentSecondary" marginBottom="12px">
        총 {favoriteListings.length}건
      </LabelSmall>

      {loading ? (
        <Block display="flex" justifyContent="center" padding="40px">
          <Spinner />
        </Block>
      ) : favoriteListings.length > 0 ? (
        <TableBuilder
          data={favoriteListings}
          overrides={{
            Root: {
              style: {
                borderRadius: theme.borders.radius300,
                overflow: 'hidden',
              },
            },
            TableBodyRow: {
              style: {
                cursor: 'pointer',
                ':hover': { backgroundColor: theme.colors.backgroundSecondary },
              },
              props: {
                onClick: (e: React.MouseEvent<HTMLTableRowElement>) => {
                  const row = e.currentTarget as HTMLTableRowElement;
                  const id = row.dataset.id;
                  if (id) router.push(`/detail/${id}`);
                },
              },
            },
          }}
        >
          <TableBuilderColumn header="★" overrides={{ TableHeadCell: { style: { width: '40px', textAlign: 'center' } }, TableBodyCell: { style: { width: '40px', textAlign: 'center' } } }}>
            {(listing: Listing) => (
              <span
                onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
                style={{ cursor: 'pointer', fontSize: '18px', color: '#FFB400' }}
              >
                <AiFillStar />
              </span>
            )}
          </TableBuilderColumn>
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
          즐겨찾기한 매물이 없습니다
        </LabelSmall>
      )}
    </Block>
  );
}
