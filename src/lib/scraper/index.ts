import { Listing } from '@/types/listing';
import { ListingFilter } from '@/types/filter';

export interface PropertyScraper {
  fetchListings(filter: ListingFilter): Promise<Partial<Listing>[]>;
  fetchListingDetail(articleNo: string): Promise<Partial<Listing> | null>;
}
