'use client';

import { useStyletron } from 'baseui';
import { Listing } from '@/types/listing';
import Link from 'next/link';

function formatPrice(price: number): string {
  if (price >= 10000) {
    const eok = Math.floor(price / 10000);
    const man = price % 10000;
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
  }
  return `${price.toLocaleString()}만`;
}

const TYPE_LABEL: Record<string, string> = {
  store: '상가',
  building: '건물',
};

const TRADE_LABEL: Record<string, string> = {
  sale: '매매',
  lease: '임대',
};

const STATUS_LABEL: Record<string, string> = {
  active: '활성',
  contracted: '계약중',
  closed: '완료',
};

const STATUS_COLOR: Record<string, string> = {
  active: '#2e7d32',
  contracted: '#ed6c02',
  closed: '#9e9e9e',
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const [css] = useStyletron();

  return (
    <Link
      href={`/detail/${listing.id}`}
      className={css({
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
      })}
    >
      <div
        className={css({
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#ffffff',
          ':hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
          transition: 'box-shadow 0.2s',
        })}
      >
        <div
          className={css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '8px',
          })}
        >
          <div className={css({ display: 'flex', gap: '6px', flexWrap: 'wrap' })}>
            <span
              className={css({
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: listing.tradeType === 'sale' ? '#e3f2fd' : '#fff3e0',
                color: listing.tradeType === 'sale' ? '#1565c0' : '#e65100',
              })}
            >
              {TRADE_LABEL[listing.tradeType]}
            </span>
            <span
              className={css({
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: '#f5f5f5',
                color: '#616161',
              })}
            >
              {TYPE_LABEL[listing.type]}
            </span>
            {listing.source === 'naver' && (
              <span
                className={css({
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                })}
              >
                네이버
              </span>
            )}
          </div>
          <span
            className={css({
              fontSize: '12px',
              fontWeight: 600,
              color: STATUS_COLOR[listing.status],
            })}
          >
            {STATUS_LABEL[listing.status]}
          </span>
        </div>

        <h3
          className={css({
            margin: '0 0 4px 0',
            fontSize: '15px',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          })}
        >
          {listing.address}
        </h3>

        {listing.addressDetail && (
          <p
            className={css({
              margin: '0 0 8px 0',
              fontSize: '13px',
              color: '#888',
            })}
          >
            {listing.addressDetail}
          </p>
        )}

        <div
          className={css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          })}
        >
          <span className={css({ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' })}>
            {formatPrice(listing.price)}
            {listing.tradeType === 'lease' && listing.monthlyRent
              ? ` / 월 ${listing.monthlyRent.toLocaleString()}만`
              : ''}
          </span>
          <div className={css({ display: 'flex', gap: '12px', fontSize: '13px', color: '#666' })}>
            <span>{listing.area}㎡</span>
            {listing.floor !== undefined && listing.floor !== null && (
              <span>
                {listing.floor}층{listing.totalFloors ? `/${listing.totalFloors}층` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export { formatPrice, TYPE_LABEL, TRADE_LABEL, STATUS_LABEL, STATUS_COLOR };
