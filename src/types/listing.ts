export type PropertyType = 'store' | 'building';
export type TradeType = 'sale' | 'lease';
export type ListingSource = 'naver' | 'manual';
export type ListingStatus = 'active' | 'contracted' | 'closed';

export interface Listing {
  id: string;
  source: ListingSource;
  type: PropertyType;
  tradeType: TradeType;
  address: string;
  addressDetail?: string;
  floor?: number;
  totalFloors?: number;
  price: number;
  deposit?: number;
  monthlyRent?: number;
  area: number;
  description?: string;
  images?: string[];
  status: ListingStatus;
  naverArticleNo?: string;
  scrapedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingDetail extends Listing {
  naverLink?: string;
}

export interface CreateListingInput {
  type: PropertyType;
  tradeType: TradeType;
  address: string;
  addressDetail?: string;
  floor?: number;
  totalFloors?: number;
  price: number;
  deposit?: number;
  monthlyRent?: number;
  area: number;
  description?: string;
  images?: string[];
}

export interface UpdateListingInput extends Partial<CreateListingInput> {
  status?: ListingStatus;
}
