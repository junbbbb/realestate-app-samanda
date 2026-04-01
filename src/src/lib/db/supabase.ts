import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Listing, ListingDetail, CreateListingInput, UpdateListingInput } from '@/types/listing';
import { ListingFilter, PaginatedResult } from '@/types/filter';
import { ListingRepository } from './index';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key must be set in environment variables');
    }
    client = createClient(supabaseUrl, supabaseKey);
  }
  return client;
}

export class SupabaseListingRepository implements ListingRepository {
  private db: SupabaseClient;

  constructor(db?: SupabaseClient) {
    this.db = db || getSupabaseClient();
  }

  async save(input: CreateListingInput): Promise<Listing> {
    const now = new Date().toISOString();
    const { data, error } = await this.db
      .from('listings')
      .insert({
        source: 'manual',
        type: input.type,
        trade_type: input.tradeType,
        address: input.address,
        address_detail: input.addressDetail,
        floor: input.floor,
        total_floors: input.totalFloors,
        price: input.price,
        deposit: input.deposit,
        monthly_rent: input.monthlyRent,
        area: input.area,
        description: input.description,
        images: input.images || [],
        status: 'active',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async saveBatch(listings: Partial<Listing>[]): Promise<void> {
    if (listings.length === 0) return;
    const now = new Date().toISOString();
    const rows = listings.map((l) => ({
      source: l.source || 'naver',
      type: l.type,
      trade_type: l.tradeType,
      address: l.address,
      address_detail: l.addressDetail,
      floor: l.floor,
      total_floors: l.totalFloors,
      price: l.price,
      deposit: l.deposit,
      monthly_rent: l.monthlyRent,
      area: l.area,
      description: l.description,
      images: l.images || [],
      status: l.status || 'active',
      naver_article_no: l.naverArticleNo,
      scraped_at: l.scrapedAt || now,
      created_at: now,
      updated_at: now,
    }));

    const { error } = await this.db
      .from('listings')
      .upsert(rows, { onConflict: 'naver_article_no', ignoreDuplicates: false });

    if (error) throw new Error(error.message);
  }

  async findByFilter(filter: ListingFilter): Promise<PaginatedResult<Listing>> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;

    let query = this.db.from('listings').select('*', { count: 'exact' });

    if (filter.type) query = query.eq('type', filter.type);
    if (filter.tradeType) query = query.eq('trade_type', filter.tradeType);
    if (filter.source && filter.source !== 'all') query = query.eq('source', filter.source);
    if (filter.status) query = query.eq('status', filter.status);
    if (filter.priceMin) query = query.gte('price', filter.priceMin);
    if (filter.priceMax) query = query.lte('price', filter.priceMax);
    if (filter.areaMin) query = query.gte('area', filter.areaMin);
    if (filter.areaMax) query = query.lte('area', filter.areaMax);
    if (filter.floor) query = query.eq('floor', filter.floor);
    if (filter.floorMin) query = query.gte('floor', filter.floorMin);
    if (filter.floorMax) query = query.lte('floor', filter.floorMax);
    if (filter.keyword) {
      query = query.or(`address.ilike.%${filter.keyword}%,description.ilike.%${filter.keyword}%`);
    }

    const sortColumn = this.getSortColumn(filter.sortBy);
    const ascending = filter.sortOrder === 'asc';
    query = query.order(sortColumn, { ascending }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const total = count || 0;
    return {
      data: (data || []).map(this.mapRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ListingDetail | null> {
    const { data, error } = await this.db
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    const listing = this.mapRow(data);
    return {
      ...listing,
      naverLink: listing.naverArticleNo
        ? `https://new.land.naver.com/offices?articleNo=${listing.naverArticleNo}`
        : undefined,
    };
  }

  async update(id: string, input: UpdateListingInput): Promise<Listing> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.type !== undefined) updateData.type = input.type;
    if (input.tradeType !== undefined) updateData.trade_type = input.tradeType;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.addressDetail !== undefined) updateData.address_detail = input.addressDetail;
    if (input.floor !== undefined) updateData.floor = input.floor;
    if (input.totalFloors !== undefined) updateData.total_floors = input.totalFloors;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.deposit !== undefined) updateData.deposit = input.deposit;
    if (input.monthlyRent !== undefined) updateData.monthly_rent = input.monthlyRent;
    if (input.area !== undefined) updateData.area = input.area;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.images !== undefined) updateData.images = input.images;
    if (input.status !== undefined) updateData.status = input.status;

    const { data, error } = await this.db
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('listings').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getNewListings(since: Date): Promise<Listing[]> {
    const { data, error } = await this.db
      .from('listings')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapRow);
  }

  async getStats(): Promise<{
    todayNew: number;
    activeManual: number;
    contractedManual: number;
    closedManual: number;
    lastScrapedAt: string | null;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayResult, activeResult, contractedResult, closedResult, lastScrapeResult] =
      await Promise.all([
        this.db
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        this.db
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('source', 'manual')
          .eq('status', 'active'),
        this.db
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('source', 'manual')
          .eq('status', 'contracted'),
        this.db
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('source', 'manual')
          .eq('status', 'closed'),
        this.db
          .from('listings')
          .select('scraped_at')
          .eq('source', 'naver')
          .order('scraped_at', { ascending: false })
          .limit(1),
      ]);

    return {
      todayNew: todayResult.count || 0,
      activeManual: activeResult.count || 0,
      contractedManual: contractedResult.count || 0,
      closedManual: closedResult.count || 0,
      lastScrapedAt: lastScrapeResult.data?.[0]?.scraped_at || null,
    };
  }

  private getSortColumn(sortBy?: string): string {
    switch (sortBy) {
      case 'price':
        return 'price';
      case 'area':
        return 'area';
      case 'floor':
        return 'floor';
      case 'date':
      default:
        return 'created_at';
    }
  }

  private mapRow(row: Record<string, unknown>): Listing {
    return {
      id: row.id as string,
      source: row.source as Listing['source'],
      type: row.type as Listing['type'],
      tradeType: row.trade_type as Listing['tradeType'],
      address: row.address as string,
      addressDetail: row.address_detail as string | undefined,
      floor: row.floor as number | undefined,
      totalFloors: row.total_floors as number | undefined,
      price: row.price as number,
      deposit: row.deposit as number | undefined,
      monthlyRent: row.monthly_rent as number | undefined,
      area: row.area as number,
      description: row.description as string | undefined,
      images: row.images as string[] | undefined,
      status: row.status as Listing['status'],
      naverArticleNo: row.naver_article_no as string | undefined,
      scrapedAt: row.scraped_at as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
