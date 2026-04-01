import { Listing } from '@/types/listing';
import { ListingFilter } from '@/types/filter';
import { PropertyScraper } from './index';

const NAVER_API_BASE = 'https://new.land.naver.com/api';
const MAPO_CORTAR_NO = '1144000000';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://new.land.naver.com/',
};

function getRealEstateType(filter: ListingFilter): string {
  if (filter.type === 'store') return 'SG';
  if (filter.type === 'building') return 'DDDGG';
  return 'SG:DDDGG';
}

function getTradeType(filter: ListingFilter): string {
  if (filter.tradeType === 'sale') return 'A1';
  if (filter.tradeType === 'lease') return 'B1:B2';
  return '';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface NaverArticle {
  articleNo: string;
  articleName?: string;
  realEstateTypeName?: string;
  tradeTypeName?: string;
  dealOrWarrantPrc?: string;
  areaName?: string;
  area2?: number;
  floorInfo?: string;
  articleConfirmYmd?: string;
  articleFeatureDesc?: string;
  direction?: string;
  buildingName?: string;
  cortarAddress?: string;
  detailAddress?: string;
  latitude?: string;
  longitude?: string;
  sameAddrCnt?: number;
  realtorName?: string;
  representImgUrl?: string;
  cpName?: string;
  totalDongCnt?: number;
  totalFloorCnt?: number;
  articleStatus?: string;
  rentPrc?: number;
}

export class NaverApiScraper implements PropertyScraper {
  async fetchListings(filter: ListingFilter): Promise<Partial<Listing>[]> {
    const allListings: Partial<Listing>[] = [];
    let page = 1;
    const maxPages = 5;

    while (page <= maxPages) {
      const params = new URLSearchParams({
        cortarNo: MAPO_CORTAR_NO,
        realEstateType: getRealEstateType(filter),
        tradeType: getTradeType(filter),
        page: String(page),
        sameAddressGroup: 'true',
      });

      const url = `${NAVER_API_BASE}/articles?${params}`;

      try {
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) {
          console.error(`Naver API error: ${response.status}`);
          break;
        }

        const data = await response.json();
        const articles: NaverArticle[] = data.articleList || [];

        if (articles.length === 0) break;

        for (const article of articles) {
          allListings.push(this.mapArticle(article));
        }

        page++;
        if (page <= maxPages) await delay(2000);
      } catch (err) {
        console.error('Naver API fetch error:', err);
        break;
      }
    }

    return allListings;
  }

  async fetchListingDetail(articleNo: string): Promise<Partial<Listing> | null> {
    const url = `${NAVER_API_BASE}/articles/${articleNo}`;
    try {
      const response = await fetch(url, { headers: HEADERS });
      if (!response.ok) return null;
      const data = await response.json();
      const article = data.articleDetail;
      if (!article) return null;
      return this.mapArticle({ ...article, articleNo });
    } catch {
      return null;
    }
  }

  private mapArticle(article: NaverArticle): Partial<Listing> {
    const realEstateType = article.realEstateTypeName || '';
    const type = realEstateType.includes('건물') ? 'building' : 'store';

    const tradeTypeName = article.tradeTypeName || '';
    const tradeType = tradeTypeName.includes('매매') ? 'sale' : 'lease';

    const priceStr = article.dealOrWarrantPrc || '0';
    const price = this.parsePrice(priceStr);

    let floor: number | undefined;
    let totalFloors: number | undefined;
    if (article.floorInfo) {
      const parts = article.floorInfo.split('/');
      floor = parseInt(parts[0]) || undefined;
      totalFloors = parseInt(parts[1]) || undefined;
    }

    return {
      source: 'naver',
      type,
      tradeType,
      address: article.cortarAddress || article.articleName || '',
      addressDetail: article.detailAddress || article.buildingName,
      floor,
      totalFloors: totalFloors || (article.totalFloorCnt ?? undefined),
      price,
      deposit: tradeType === 'lease' ? price : undefined,
      monthlyRent: tradeType === 'lease' ? (article.rentPrc ?? undefined) : undefined,
      area: article.area2 || 0,
      description: article.articleFeatureDesc,
      images: article.representImgUrl ? [article.representImgUrl] : [],
      status: 'active',
      naverArticleNo: article.articleNo,
      scrapedAt: new Date().toISOString(),
    };
  }

  private parsePrice(str: string): number {
    const cleaned = str.replace(/[^0-9억만]/g, '');
    let total = 0;
    const eokMatch = cleaned.match(/(\d+)억/);
    const manMatch = cleaned.match(/억?\s*(\d+)(?:만)?$/);
    if (eokMatch) total += parseInt(eokMatch[1]) * 10000;
    if (manMatch) total += parseInt(manMatch[1]);
    if (total === 0) {
      const num = parseInt(cleaned.replace(/[^0-9]/g, ''));
      if (!isNaN(num)) total = num;
    }
    return total;
  }
}
