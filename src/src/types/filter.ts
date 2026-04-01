import { PropertyType, TradeType, ListingSource } from './listing';

export interface ListingFilter {
  type?: PropertyType;
  tradeType?: TradeType;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  floor?: number;
  floorMin?: number;
  floorMax?: number;
  keyword?: string;
  source?: ListingSource | 'all';
  status?: 'active' | 'contracted' | 'closed';
  sortBy?: 'price' | 'area' | 'date' | 'floor';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
