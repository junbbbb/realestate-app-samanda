'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStyletron } from 'baseui';
import { Input } from 'baseui/input';
import { Textarea } from 'baseui/textarea';
import { Select, Value } from 'baseui/select';
import { Button } from 'baseui/button';
import { Spinner } from 'baseui/spinner';
import FormField from '@/components/FormField';
import { Listing } from '@/types/listing';

const TYPE_OPTIONS = [
  { label: '상가', id: 'store' },
  { label: '건물', id: 'building' },
];

const TRADE_OPTIONS = [
  { label: '매매', id: 'sale' },
  { label: '임대', id: 'lease' },
];

const STATUS_OPTIONS = [
  { label: '활성', id: 'active' },
  { label: '계약중', id: 'contracted' },
  { label: '완료', id: 'closed' },
];

export default function EditListingPage() {
  const [css] = useStyletron();
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<Value>([]);
  const [tradeType, setTradeType] = useState<Value>([]);
  const [status, setStatus] = useState<Value>([]);
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

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/listings/${params.id}`);
        if (res.ok) {
          const listing: Listing = await res.json();
          setType(TYPE_OPTIONS.filter((o) => o.id === listing.type));
          setTradeType(TRADE_OPTIONS.filter((o) => o.id === listing.tradeType));
          setStatus(STATUS_OPTIONS.filter((o) => o.id === listing.status));
          setAddress(listing.address);
          setAddressDetail(listing.addressDetail || '');
          setPrice(String(listing.price));
          setDeposit(listing.deposit ? String(listing.deposit) : '');
          setMonthlyRent(listing.monthlyRent ? String(listing.monthlyRent) : '');
          setArea(String(listing.area));
          setFloor(listing.floor ? String(listing.floor) : '');
          setTotalFloors(listing.totalFloors ? String(listing.totalFloors) : '');
          setDescription(listing.description || '');
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

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
        status: status[0]?.id,
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

      const res = await fetch(`/api/listings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push(`/detail/${params.id}`);
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

  if (loading) {
    return (
      <div className={css({ display: 'flex', justifyContent: 'center', padding: '60px' })}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={css({ padding: '20px', maxWidth: '600px', margin: '0 auto' })}>
      <Button
        onClick={() => router.back()}
        kind="tertiary"
        size="compact"
        overrides={{ BaseButton: { style: { marginBottom: '12px', paddingLeft: 0 } } }}
      >
        ← 뒤로
      </Button>

      <h1 className={css({ fontSize: '24px', fontWeight: 700, marginBottom: '20px' })}>
        매물 수정
      </h1>

      {error && (
        <div className={css({ padding: '12px', backgroundColor: '#fdecea', color: '#d32f2f', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' })}>
          {error}
        </div>
      )}

      <div className={css({ display: 'flex', flexDirection: 'column', gap: '16px' })}>
        <div className={css({ display: 'flex', gap: '12px' })}>
          <div className={css({ flex: 1 })}>
            <FormField label="유형">
              <Select options={TYPE_OPTIONS} value={type} onChange={({ value }) => setType(value)} clearable={false} />
            </FormField>
          </div>
          <div className={css({ flex: 1 })}>
            <FormField label="거래 유형">
              <Select options={TRADE_OPTIONS} value={tradeType} onChange={({ value }) => setTradeType(value)} clearable={false} />
            </FormField>
          </div>
        </div>

        <FormField label="상태">
          <Select options={STATUS_OPTIONS} value={status} onChange={({ value }) => setStatus(value)} clearable={false} />
        </FormField>

        <FormField label="주소 *">
          <Input value={address} onChange={(e) => setAddress(e.currentTarget.value)} />
        </FormField>

        <FormField label="상세주소">
          <Input value={addressDetail} onChange={(e) => setAddressDetail(e.currentTarget.value)} />
        </FormField>

        <FormField label={isLease ? '보증금 (만원) *' : '매매가 (만원) *'}>
          <Input value={price} onChange={(e) => setPrice(e.currentTarget.value)} type="number" />
        </FormField>

        {isLease && (
          <>
            <FormField label="보증금 (만원)">
              <Input value={deposit} onChange={(e) => setDeposit(e.currentTarget.value)} type="number" />
            </FormField>
            <FormField label="월세 (만원)">
              <Input value={monthlyRent} onChange={(e) => setMonthlyRent(e.currentTarget.value)} type="number" />
            </FormField>
          </>
        )}

        <FormField label="면적 (㎡) *">
          <Input value={area} onChange={(e) => setArea(e.currentTarget.value)} type="number" />
        </FormField>

        <div className={css({ display: 'flex', gap: '12px' })}>
          <div className={css({ flex: 1 })}>
            <FormField label="층수">
              <Input value={floor} onChange={(e) => setFloor(e.currentTarget.value)} type="number" />
            </FormField>
          </div>
          <div className={css({ flex: 1 })}>
            <FormField label="총 층수">
              <Input value={totalFloors} onChange={(e) => setTotalFloors(e.currentTarget.value)} type="number" />
            </FormField>
          </div>
        </div>

        <FormField label="설명">
          <Textarea value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
        </FormField>

        <Button onClick={handleSubmit} isLoading={saving} overrides={{ BaseButton: { style: { marginTop: '8px' } } }}>
          저장
        </Button>
      </div>
    </div>
  );
}
