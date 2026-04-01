'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from 'baseui/input';
import { Textarea } from 'baseui/textarea';
import { Select, Value } from 'baseui/select';
import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { Notification, KIND as NKIND } from 'baseui/notification';
import { HeadingXLarge } from 'baseui/typography';
import { Block } from 'baseui/block';
import { FlexGrid, FlexGridItem } from 'baseui/flex-grid';
import { ChevronLeft } from 'baseui/icon';

const TYPE_OPTIONS = [
  { label: '상가', id: 'store' },
  { label: '건물', id: 'building' },
];

const TRADE_OPTIONS = [
  { label: '매매', id: 'sale' },
  { label: '임대', id: 'lease' },
];

export default function NewListingPage() {
  const router = useRouter();

  const [type, setType] = useState<Value>([TYPE_OPTIONS[0]]);
  const [tradeType, setTradeType] = useState<Value>([TRADE_OPTIONS[0]]);
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [area, setArea] = useState('');
  const [floor, setFloor] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isLease = (tradeType[0]?.id as string) === 'lease';

  async function handleSubmit() {
    if (!address || !price || !area) {
      setError('주소, 가격, 면적은 필수입니다');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const body = {
        type: type[0]?.id,
        tradeType: tradeType[0]?.id,
        address,
        addressDetail: addressDetail || undefined,
        price: Number(price),
        deposit: isLease && deposit ? Number(deposit) : undefined,
        monthlyRent: isLease && monthlyRent ? Number(monthlyRent) : undefined,
        area: Number(area),
        floor: floor ? Number(floor) : undefined,
        totalFloors: totalFloors ? Number(totalFloors) : undefined,
        description: description || undefined,
      };

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/my-listings');
      } else {
        const data = await res.json();
        setError(data.error || '저장에 실패했습니다');
      }
    } catch {
      setError('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Block maxWidth="800px">
      <Button
        onClick={() => router.back()}
        kind="tertiary"
        size="compact"
        startEnhancer={() => <ChevronLeft size={20} />}
        overrides={{ BaseButton: { style: { marginBottom: '12px', paddingLeft: 0 } } }}
      >
        뒤로
      </Button>

      <HeadingXLarge marginTop="0" marginBottom="24px">
        매물 등록
      </HeadingXLarge>

      {error && (
        <Block marginBottom="16px">
          <Notification kind={NKIND.negative} closeable>{error}</Notification>
        </Block>
      )}

      <Block display="flex" flexDirection="column" gridGap="8px">
        <FlexGrid flexGridColumnCount={2} flexGridColumnGap="16px">
          <FlexGridItem>
            <FormControl label="유형">
              <Select options={TYPE_OPTIONS} value={type} onChange={({ value }) => setType(value)} clearable={false} />
            </FormControl>
          </FlexGridItem>
          <FlexGridItem>
            <FormControl label="거래 유형">
              <Select options={TRADE_OPTIONS} value={tradeType} onChange={({ value }) => setTradeType(value)} clearable={false} />
            </FormControl>
          </FlexGridItem>
        </FlexGrid>

        <FormControl label="주소 *">
          <Input value={address} onChange={(e) => setAddress(e.currentTarget.value)} placeholder="예: 서울 마포구 성산동 123-4" />
        </FormControl>

        <FormControl label="상세주소">
          <Input value={addressDetail} onChange={(e) => setAddressDetail(e.currentTarget.value)} placeholder="예: OO빌딩 3층" />
        </FormControl>

        <FormControl label={isLease ? '보증금 (만원) *' : '매매가 (만원) *'}>
          <Input value={price} onChange={(e) => setPrice(e.currentTarget.value)} placeholder="숫자만 입력" type="number" />
        </FormControl>

        {isLease && (
          <FlexGrid flexGridColumnCount={2} flexGridColumnGap="16px">
            <FlexGridItem>
              <FormControl label="보증금 (만원)">
                <Input value={deposit} onChange={(e) => setDeposit(e.currentTarget.value)} placeholder="숫자만 입력" type="number" />
              </FormControl>
            </FlexGridItem>
            <FlexGridItem>
              <FormControl label="월세 (만원)">
                <Input value={monthlyRent} onChange={(e) => setMonthlyRent(e.currentTarget.value)} placeholder="숫자만 입력" type="number" />
              </FormControl>
            </FlexGridItem>
          </FlexGrid>
        )}

        <FormControl label="면적 (㎡) *">
          <Input value={area} onChange={(e) => setArea(e.currentTarget.value)} placeholder="숫자만 입력" type="number" />
        </FormControl>

        <FlexGrid flexGridColumnCount={2} flexGridColumnGap="16px">
          <FlexGridItem>
            <FormControl label="층수">
              <Input value={floor} onChange={(e) => setFloor(e.currentTarget.value)} placeholder="예: 3" type="number" />
            </FormControl>
          </FlexGridItem>
          <FlexGridItem>
            <FormControl label="총 층수">
              <Input value={totalFloors} onChange={(e) => setTotalFloors(e.currentTarget.value)} placeholder="예: 5" type="number" />
            </FormControl>
          </FlexGridItem>
        </FlexGrid>

        <FormControl label="설명">
          <Textarea value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder="매물에 대한 설명을 입력하세요" />
        </FormControl>

        <Block marginTop="8px">
          <Button onClick={handleSubmit} isLoading={saving}>
            매물 등록
          </Button>
        </Block>
      </Block>
    </Block>
  );
}
