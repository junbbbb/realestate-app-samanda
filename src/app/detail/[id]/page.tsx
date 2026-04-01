'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Spinner } from 'baseui/spinner';
import { ListingDetail } from '@/types/listing';
import {
  formatPrice,
  TYPE_LABEL,
  TRADE_LABEL,
  STATUS_LABEL,
  STATUS_COLOR,
} from '@/components/ListingCard';

export default function DetailPage() {
  const [css] = useStyletron();
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/listings/${params.id}`);
        if (res.ok) {
          setListing(await res.json());
        }
      } catch (err) {
        console.error('Detail load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className={css({ display: 'flex', justifyContent: 'center', padding: '60px' })}>
        <Spinner />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className={css({ padding: '20px', textAlign: 'center' })}>
        <p>매물을 찾을 수 없습니다</p>
        <Button onClick={() => router.back()} kind="secondary">
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className={css({ padding: '20px', maxWidth: '600px', margin: '0 auto' })}>
      {/* Back button */}
      <Button
        onClick={() => router.back()}
        kind="tertiary"
        size="compact"
        overrides={{ BaseButton: { style: { marginBottom: '12px', paddingLeft: 0 } } }}
      >
        ← 뒤로
      </Button>

      {/* Header */}
      <div className={css({ marginBottom: '20px' })}>
        <div className={css({ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' })}>
          <span
            className={css({
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: listing.tradeType === 'sale' ? '#e3f2fd' : '#fff3e0',
              color: listing.tradeType === 'sale' ? '#1565c0' : '#e65100',
            })}
          >
            {TRADE_LABEL[listing.tradeType]}
          </span>
          <span
            className={css({
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '13px',
              backgroundColor: '#f5f5f5',
              color: '#616161',
            })}
          >
            {TYPE_LABEL[listing.type]}
          </span>
          <span
            className={css({
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              color: STATUS_COLOR[listing.status],
              backgroundColor: '#f5f5f5',
            })}
          >
            {STATUS_LABEL[listing.status]}
          </span>
          {listing.source === 'naver' && (
            <span
              className={css({
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '13px',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
              })}
            >
              네이버
            </span>
          )}
        </div>
        <h1 className={css({ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0' })}>
          {listing.address}
        </h1>
        {listing.addressDetail && (
          <p className={css({ fontSize: '15px', color: '#666', margin: 0 })}>
            {listing.addressDetail}
          </p>
        )}
      </div>

      {/* Price */}
      <div
        className={css({
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e0e0e0',
          marginBottom: '16px',
        })}
      >
        <p className={css({ fontSize: '13px', color: '#888', margin: '0 0 4px 0' })}>
          {listing.tradeType === 'sale' ? '매매가' : '보증금'}
        </p>
        <p className={css({ fontSize: '28px', fontWeight: 700, margin: 0, color: '#1a1a1a' })}>
          {formatPrice(listing.price)}
        </p>
        {listing.tradeType === 'lease' && listing.monthlyRent !== undefined && (
          <p className={css({ fontSize: '16px', color: '#e65100', margin: '4px 0 0 0' })}>
            월세 {listing.monthlyRent.toLocaleString()}만원
          </p>
        )}
      </div>

      {/* Info Grid */}
      <div
        className={css({
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e0e0e0',
          marginBottom: '16px',
        })}
      >
        <h3 className={css({ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' })}>
          상세 정보
        </h3>
        <div className={css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' })}>
          <InfoItem label="면적" value={`${listing.area}㎡`} />
          {listing.floor !== undefined && listing.floor !== null && (
            <InfoItem
              label="층수"
              value={`${listing.floor}층${listing.totalFloors ? ` / ${listing.totalFloors}층` : ''}`}
            />
          )}
          <InfoItem label="유형" value={TYPE_LABEL[listing.type]} />
          <InfoItem label="거래" value={TRADE_LABEL[listing.tradeType]} />
          {listing.source === 'naver' && listing.scrapedAt && (
            <InfoItem
              label="수집일"
              value={new Date(listing.scrapedAt).toLocaleDateString('ko-KR')}
            />
          )}
          <InfoItem
            label="등록일"
            value={new Date(listing.createdAt).toLocaleDateString('ko-KR')}
          />
        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <div
          className={css({
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e0e0e0',
            marginBottom: '16px',
          })}
        >
          <h3 className={css({ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0' })}>
            설명
          </h3>
          <p className={css({ fontSize: '14px', lineHeight: '1.6', color: '#333', margin: 0, whiteSpace: 'pre-wrap' })}>
            {listing.description}
          </p>
        </div>
      )}

      {/* Images */}
      {listing.images && listing.images.length > 0 && (
        <div
          className={css({
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e0e0e0',
            marginBottom: '16px',
          })}
        >
          <h3 className={css({ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' })}>
            사진
          </h3>
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '8px' })}>
            {listing.images.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`매물 사진 ${i + 1}`}
                className={css({
                  width: '100%',
                  borderRadius: '8px',
                  objectFit: 'cover',
                })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Naver Link */}
      {listing.naverLink && (
        <a
          href={listing.naverLink}
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            display: 'block',
            textAlign: 'center',
            padding: '12px',
            backgroundColor: '#03C75A',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '15px',
          })}
        >
          네이버 부동산에서 보기
        </a>
      )}

      {/* Edit/Delete for manual listings */}
      {listing.source === 'manual' && (
        <div className={css({ display: 'flex', gap: '8px', marginTop: '16px' })}>
          <Button
            onClick={() => router.push(`/my-listings/edit/${listing.id}`)}
            kind="secondary"
            overrides={{ BaseButton: { style: { flex: 1 } } }}
          >
            수정
          </Button>
          <Button
            onClick={async () => {
              if (confirm('정말 삭제하시겠습니까?')) {
                await fetch(`/api/listings/${listing.id}`, { method: 'DELETE' });
                router.push('/my-listings');
              }
            }}
            kind="secondary"
            overrides={{
              BaseButton: {
                style: { flex: 1, color: '#d32f2f', borderColor: '#d32f2f' },
              },
            }}
          >
            삭제
          </Button>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  const [css] = useStyletron();
  return (
    <div>
      <p className={css({ fontSize: '12px', color: '#888', margin: '0 0 2px 0' })}>{label}</p>
      <p className={css({ fontSize: '15px', fontWeight: 500, margin: 0 })}>{value}</p>
    </div>
  );
}
