'use client';

import { useStyletron } from 'baseui';
import { Tag, KIND, HIERARCHY } from 'baseui/tag';
import { LabelMedium, ParagraphSmall } from 'baseui/typography';
import { Block } from 'baseui/block';
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

const STATUS_KIND: Record<string, typeof KIND[keyof typeof KIND]> = {
  active: KIND.positive,
  contracted: KIND.warning,
  closed: KIND.neutral,
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const [css, theme] = useStyletron();

  return (
    <Link
      href={`/detail/${listing.id}`}
      className={css({
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
      })}
    >
      <Block
        backgroundColor={theme.colors.backgroundPrimary}
        padding="16px 20px"
        overrides={{
          Block: {
            style: {
              border: `1px solid ${theme.colors.borderOpaque}`,
              borderRadius: theme.borders.radius300,
              ':hover': { boxShadow: theme.lighting.shadow400 },
              transition: 'box-shadow 0.2s',
              cursor: 'pointer',
            },
          },
        }}
      >
        <Block display="flex" justifyContent="space-between" alignItems="center" marginBottom="8px">
          <Block display="flex" gridGap="4px" alignItems="center">
            <Tag
              closeable={false}
              kind={listing.tradeType === 'sale' ? KIND.accent : KIND.warning}
              hierarchy={HIERARCHY.secondary}
              overrides={{ Root: { style: { marginLeft: 0, marginTop: 0, marginBottom: 0 } } }}
            >
              {TRADE_LABEL[listing.tradeType]}
            </Tag>
            <Tag
              closeable={false}
              kind={KIND.neutral}
              hierarchy={HIERARCHY.secondary}
              overrides={{ Root: { style: { marginLeft: 0, marginTop: 0, marginBottom: 0 } } }}
            >
              {TYPE_LABEL[listing.type]}
            </Tag>
            {listing.source === 'naver' && (
              <Tag
                closeable={false}
                kind={KIND.positive}
                hierarchy={HIERARCHY.secondary}
                overrides={{ Root: { style: { marginLeft: 0, marginTop: 0, marginBottom: 0 } } }}
              >
                네이버
              </Tag>
            )}
          </Block>
          <Tag
            closeable={false}
            kind={STATUS_KIND[listing.status]}
            hierarchy={HIERARCHY.primary}
            overrides={{ Root: { style: { marginRight: 0, marginTop: 0, marginBottom: 0 } } }}
          >
            {STATUS_LABEL[listing.status]}
          </Tag>
        </Block>

        <LabelMedium
          overrides={{
            Block: {
              style: {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '4px',
              },
            },
          }}
        >
          {listing.address}
        </LabelMedium>

        {listing.addressDetail && (
          <ParagraphSmall color="contentSecondary" marginTop="0" marginBottom="8px">
            {listing.addressDetail}
          </ParagraphSmall>
        )}

        <Block display="flex" justifyContent="space-between" alignItems="center">
          <LabelMedium
            overrides={{
              Block: { style: { ...theme.typography.LabelLarge, fontWeight: theme.typography.font650.fontWeight } },
            }}
          >
            {formatPrice(listing.price)}
            {listing.tradeType === 'lease' && listing.monthlyRent
              ? ` / 월 ${listing.monthlyRent.toLocaleString()}만`
              : ''}
          </LabelMedium>
          <Block display="flex" gridGap="12px">
            <ParagraphSmall color="contentSecondary" margin="0">
              {listing.area}㎡
            </ParagraphSmall>
            {listing.floor !== undefined && listing.floor !== null && (
              <ParagraphSmall color="contentSecondary" margin="0">
                {listing.floor}층{listing.totalFloors ? `/${listing.totalFloors}층` : ''}
              </ParagraphSmall>
            )}
          </Block>
        </Block>
      </Block>
    </Link>
  );
}

export { formatPrice, TYPE_LABEL, TRADE_LABEL, STATUS_LABEL, STATUS_KIND };
