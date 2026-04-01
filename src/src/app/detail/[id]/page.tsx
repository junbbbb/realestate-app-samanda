'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { Spinner } from 'baseui/spinner';
import { Card, StyledBody } from 'baseui/card';
import { Tag, KIND, HIERARCHY } from 'baseui/tag';
import { HeadingXLarge, HeadingSmall, LabelSmall, LabelMedium, ParagraphMedium } from 'baseui/typography';
import { Block } from 'baseui/block';
import { FlexGrid, FlexGridItem } from 'baseui/flex-grid';
import { ChevronLeft, Delete } from 'baseui/icon';
import { MdEdit } from 'react-icons/md';
import Image from 'next/image';
import { ListingDetail } from '@/types/listing';
import {
  formatPrice,
  TYPE_LABEL,
  TRADE_LABEL,
  STATUS_LABEL,
  STATUS_KIND,
} from '@/components/ListingCard';
import { fetchLocalDetail } from '@/lib/local-listings';

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
          const data = await res.json();
          if (data && data.id) {
            setListing(data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Detail load error:', err);
      }
      // Fallback to local data
      try {
        const local = await fetchLocalDetail(params.id as string);
        if (local) setListing(local);
      } catch {}
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <Block display="flex" justifyContent="center" padding="60px">
        <Spinner />
      </Block>
    );
  }

  if (!listing) {
    return (
      <Block padding="20px" $style={{ textAlign: 'center' }}>
        <ParagraphMedium>매물을 찾을 수 없습니다</ParagraphMedium>
        <Button onClick={() => router.back()} kind="secondary">
          돌아가기
        </Button>
      </Block>
    );
  }

  return (
    <Block maxWidth="900px">
      {/* Back button */}
      <Button
        onClick={() => router.back()}
        kind="tertiary"
        size="compact"
        startEnhancer={() => <ChevronLeft size={20} />}
        overrides={{ BaseButton: { style: { marginBottom: '12px', paddingLeft: 0 } } }}
      >
        뒤로
      </Button>

      {/* Header */}
      <Block marginBottom="24px">
        <Block display="flex" gridGap="8px" marginBottom="12px" flexWrap>
          <Tag
            closeable={false}
            kind={listing.tradeType === 'sale' ? KIND.accent : KIND.warning}
            hierarchy={HIERARCHY.secondary}
            overrides={{ Root: { style: { marginLeft: 0 } } }}
          >
            {TRADE_LABEL[listing.tradeType]}
          </Tag>
          <Tag closeable={false} kind={KIND.neutral} hierarchy={HIERARCHY.secondary}
            overrides={{ Root: { style: { marginLeft: 0 } } }}>
            {TYPE_LABEL[listing.type]}
          </Tag>
          <Tag closeable={false} kind={STATUS_KIND[listing.status]} hierarchy={HIERARCHY.primary}
            overrides={{ Root: { style: { marginLeft: 0 } } }}>
            {STATUS_LABEL[listing.status]}
          </Tag>
          {listing.source === 'naver' && (
            <Tag closeable={false} kind={KIND.positive} hierarchy={HIERARCHY.secondary}
              overrides={{ Root: { style: { marginLeft: 0 } } }}>
              네이버
            </Tag>
          )}
        </Block>
        <HeadingXLarge marginTop="0" marginBottom="4px">
          {listing.address}
        </HeadingXLarge>
        {listing.addressDetail && (
          <ParagraphMedium color="contentSecondary" margin="0">
            {listing.addressDetail}
          </ParagraphMedium>
        )}
      </Block>

      <FlexGrid flexGridColumnCount={2} flexGridColumnGap="16px" flexGridRowGap="16px" marginBottom="24px">
        {/* Price Card */}
        <FlexGridItem>
          <Card overrides={{ Root: { style: { borderRadius: '8px' } } }}>
            <StyledBody>
              <LabelSmall color="contentSecondary" marginBottom="4px">
                {listing.tradeType === 'sale' ? '매매가' : '보증금'}
              </LabelSmall>
              <HeadingXLarge margin="0">{formatPrice(listing.price)}</HeadingXLarge>
              {listing.tradeType === 'lease' && listing.monthlyRent !== undefined && (
                <LabelMedium color="warning" marginTop="4px">
                  월세 {listing.monthlyRent.toLocaleString()}만원
                </LabelMedium>
              )}
            </StyledBody>
          </Card>
        </FlexGridItem>

        {/* Info Card */}
        <FlexGridItem>
          <Card overrides={{ Root: { style: { borderRadius: '8px' } } }}>
            <StyledBody>
              <HeadingSmall marginTop="0" marginBottom="12px">상세 정보</HeadingSmall>
              <FlexGrid flexGridColumnCount={2} flexGridColumnGap="12px" flexGridRowGap="12px">
                <FlexGridItem>
                  <LabelSmall color="contentSecondary">면적</LabelSmall>
                  <LabelMedium>{listing.area}㎡</LabelMedium>
                </FlexGridItem>
                {listing.floor !== undefined && listing.floor !== null && (
                  <FlexGridItem>
                    <LabelSmall color="contentSecondary">층수</LabelSmall>
                    <LabelMedium>
                      {listing.floor}층{listing.totalFloors ? ` / ${listing.totalFloors}층` : ''}
                    </LabelMedium>
                  </FlexGridItem>
                )}
                <FlexGridItem>
                  <LabelSmall color="contentSecondary">유형</LabelSmall>
                  <LabelMedium>{TYPE_LABEL[listing.type]}</LabelMedium>
                </FlexGridItem>
                <FlexGridItem>
                  <LabelSmall color="contentSecondary">거래</LabelSmall>
                  <LabelMedium>{TRADE_LABEL[listing.tradeType]}</LabelMedium>
                </FlexGridItem>
                {listing.source === 'naver' && listing.scrapedAt && (
                  <FlexGridItem>
                    <LabelSmall color="contentSecondary">수집일</LabelSmall>
                    <LabelMedium>{new Date(listing.scrapedAt).toLocaleDateString('ko-KR')}</LabelMedium>
                  </FlexGridItem>
                )}
                <FlexGridItem>
                  <LabelSmall color="contentSecondary">등록일</LabelSmall>
                  <LabelMedium>{new Date(listing.createdAt).toLocaleDateString('ko-KR')}</LabelMedium>
                </FlexGridItem>
              </FlexGrid>
            </StyledBody>
          </Card>
        </FlexGridItem>
      </FlexGrid>

      {/* Description */}
      {listing.description && (
        <Card overrides={{ Root: { style: { borderRadius: '8px', marginBottom: '16px' } } }}>
          <StyledBody>
            <HeadingSmall marginTop="0" marginBottom="8px">설명</HeadingSmall>
            <ParagraphMedium $style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }} margin="0">
              {listing.description}
            </ParagraphMedium>
          </StyledBody>
        </Card>
      )}

      {/* Images */}
      {listing.images && listing.images.length > 0 && (
        <Card overrides={{ Root: { style: { borderRadius: '8px', marginBottom: '16px' } } }}>
          <StyledBody>
            <HeadingSmall marginTop="0" marginBottom="12px">사진</HeadingSmall>
            <Block display="flex" flexDirection="column" gridGap="8px">
              {listing.images.map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  alt={`매물 사진 ${i + 1}`}
                  width={0}
                  height={0}
                  sizes="100vw"
                  className={css({
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    objectFit: 'cover',
                  })}
                />
              ))}
            </Block>
          </StyledBody>
        </Card>
      )}

      {/* Naver Link */}
      {listing.naverLink && (
        <Block marginBottom="16px">
          <Button
            onClick={() => window.open(listing.naverLink, '_blank')}
            kind="secondary"
            overrides={{
              BaseButton: {
                style: {
                  width: '100%',
                  backgroundColor: '#03C75A',
                  color: '#fff',
                  ':hover': { backgroundColor: '#02b351' },
                },
              },
            }}
          >
            네이버 부동산에서 보기
          </Button>
        </Block>
      )}

      {/* Edit/Delete for manual listings */}
      {listing.source === 'manual' && (
        <Block display="flex" gridGap="12px" marginTop="16px">
          <Button
            onClick={() => router.push(`/my-listings/edit/${listing.id}`)}
            kind="secondary"
            startEnhancer={() => <MdEdit size={16} />}
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
            startEnhancer={() => <Delete size={16} />}
            overrides={{
              BaseButton: {
                style: { flex: 1, color: '#d32f2f', borderColor: '#d32f2f' },
              },
            }}
          >
            삭제
          </Button>
        </Block>
      )}
    </Block>
  );
}
