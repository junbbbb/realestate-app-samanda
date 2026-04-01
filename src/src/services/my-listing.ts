import { ListingRepository } from '@/lib/db';
import { Listing, CreateListingInput, UpdateListingInput, ListingStatus } from '@/types/listing';
import { PaginatedResult } from '@/types/filter';

export class MyListingService {
  constructor(private repo: ListingRepository) {}

  async create(input: CreateListingInput): Promise<Listing> {
    return this.repo.save(input);
  }

  async update(id: string, input: UpdateListingInput): Promise<Listing> {
    return this.repo.update(id, input);
  }

  async changeStatus(id: string, status: ListingStatus): Promise<Listing> {
    return this.repo.update(id, { status });
  }

  async delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }

  async getMyListings(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Listing>> {
    return this.repo.findByFilter({
      source: 'manual',
      sortBy: 'date',
      sortOrder: 'desc',
      page,
      limit,
    });
  }
}
