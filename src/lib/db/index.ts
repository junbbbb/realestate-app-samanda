import { Listing, ListingDetail, CreateListingInput, UpdateListingInput } from '@/types/listing';
import { ListingFilter, PaginatedResult } from '@/types/filter';

export interface ListingRepository {
  save(listing: CreateListingInput): Promise<Listing>;
  saveBatch(listings: Partial<Listing>[]): Promise<void>;
  findByFilter(filter: ListingFilter): Promise<PaginatedResult<Listing>>;
  findById(id: string): Promise<ListingDetail | null>;
  update(id: string, data: UpdateListingInput): Promise<Listing>;
  delete(id: string): Promise<void>;
  getNewListings(since: Date): Promise<Listing[]>;
  getStats(): Promise<{
    todayNew: number;
    activeManual: number;
    contractedManual: number;
    closedManual: number;
    lastScrapedAt: string | null;
  }>;
}
