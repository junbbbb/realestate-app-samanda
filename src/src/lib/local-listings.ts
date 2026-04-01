import { Listing, ListingDetail } from '@/types/listing';

interface ScrapedListing {
  source: string;
  type: string;
  tradeType: string;
  address: string;
  addressDetail?: string;
  floor: number | null;
  price: number;
  priceRaw?: string;
  area: number;
  description?: string;
  naverArticleNo: string;
  realEstateTypeName?: string;
  tradeTypeName?: string;
  floorInfo?: string;
  scrapedAt: string;
}

interface ScrapedData {
  scrapedAt: string;
  totalCount: number;
  region: string;
  listings: ScrapedListing[];
}

function parseFloorInfo(floorInfo?: string): { floor?: number; totalFloors?: number } {
  if (!floorInfo) return {};
  const match = floorInfo.match(/^([B]?\d+)\/?(\d+)?$/);
  if (!match) return {};
  const floorStr = match[1];
  const floor = floorStr.startsWith('B') ? -parseInt(floorStr.slice(1)) : parseInt(floorStr);
  const totalFloors = match[2] ? parseInt(match[2]) : undefined;
  return { floor, totalFloors };
}

function parsePriceRaw(priceRaw?: string): number {
  if (!priceRaw) return 0;
  let total = 0;
  const eokMatch = priceRaw.match(/(\d+)억/);
  if (eokMatch) total += parseInt(eokMatch[1]) * 10000;
  const remaining = priceRaw.replace(/\d+억\s*/, '').replace(/,/g, '').trim();
  if (remaining && !isNaN(Number(remaining))) {
    total += parseInt(remaining);
  }
  return total;
}

export function mapScrapedToListing(item: ScrapedListing): Listing {
  const { floor, totalFloors } = parseFloorInfo(item.floorInfo);
  const price = item.price > 0 ? item.price : parsePriceRaw(item.priceRaw);

  return {
    id: item.naverArticleNo,
    source: item.source as Listing['source'],
    type: item.type as Listing['type'],
    tradeType: item.tradeType as Listing['tradeType'],
    address: item.address,
    addressDetail: item.addressDetail,
    floor: floor ?? (item.floor ?? undefined),
    totalFloors,
    price,
    area: item.area,
    description: item.description,
    status: 'active',
    naverArticleNo: item.naverArticleNo,
    scrapedAt: item.scrapedAt,
    createdAt: item.scrapedAt,
    updatedAt: item.scrapedAt,
  };
}

export function mapScrapedToDetail(item: ScrapedListing): ListingDetail {
  const listing = mapScrapedToListing(item);
  return {
    ...listing,
    naverLink: `https://land.naver.com/article/info/${item.naverArticleNo}`,
  };
}

export async function fetchLocalListings(): Promise<{ listings: Listing[]; scrapedAt: string }> {
  const res = await fetch('/api/local-listings');
  if (!res.ok) return { listings: [], scrapedAt: '' };
  const data: ScrapedData = await res.json();
  return {
    listings: (data.listings || []).map(mapScrapedToListing),
    scrapedAt: data.scrapedAt || '',
  };
}

export async function fetchLocalDetail(id: string): Promise<ListingDetail | null> {
  const res = await fetch('/api/local-listings');
  if (!res.ok) return null;
  const data: ScrapedData = await res.json();
  const item = (data.listings || []).find((l) => l.naverArticleNo === id);
  return item ? mapScrapedToDetail(item) : null;
}
