import { PropertyScraper } from '@/lib/scraper';
import { ListingRepository } from '@/lib/db';
import { ListingFilter } from '@/types/filter';

export class ScraperJobService {
  constructor(
    private scraper: PropertyScraper,
    private repo: ListingRepository
  ) {}

  async runDailyScrape(): Promise<{ total: number; saved: number }> {
    const filters: ListingFilter[] = [
      { type: 'store' },
      { type: 'building' },
    ];

    let total = 0;
    let saved = 0;

    for (const filter of filters) {
      const listings = await this.scraper.fetchListings(filter);
      total += listings.length;

      if (listings.length > 0) {
        await this.repo.saveBatch(listings);
        saved += listings.length;
      }
    }

    return { total, saved };
  }
}
