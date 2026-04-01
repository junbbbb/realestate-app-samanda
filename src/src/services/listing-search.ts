import { ListingRepository } from '@/lib/db';
import { ListingFilter, PaginatedResult } from '@/types/filter';
import { Listing, ListingDetail } from '@/types/listing';

export class ListingSearchService {
  constructor(private repo: ListingRepository) {}

  async search(filter: ListingFilter): Promise<PaginatedResult<Listing>> {
    return this.repo.findByFilter(filter);
  }

  async getDetail(id: string): Promise<ListingDetail | null> {
    return this.repo.findById(id);
  }

  async getRecentListings(limit: number = 5): Promise<Listing[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await this.repo.findByFilter({
      sortBy: 'date',
      sortOrder: 'desc',
      limit,
      page: 1,
    });
    return result.data;
  }
}
