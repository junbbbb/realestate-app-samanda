export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseListingRepository } from '@/lib/db/supabase';
import { ListingSearchService } from '@/services/listing-search';
import { MyListingService } from '@/services/my-listing';
import { ListingFilter } from '@/types/filter';

function getServices() {
  const repo = new SupabaseListingRepository();
  return {
    search: new ListingSearchService(repo),
    myListing: new MyListingService(repo),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { search } = getServices();

    const filter: ListingFilter = {};
    if (searchParams.get('type')) filter.type = searchParams.get('type') as ListingFilter['type'];
    if (searchParams.get('tradeType'))
      filter.tradeType = searchParams.get('tradeType') as ListingFilter['tradeType'];
    if (searchParams.get('source'))
      filter.source = searchParams.get('source') as ListingFilter['source'];
    if (searchParams.get('status'))
      filter.status = searchParams.get('status') as ListingFilter['status'];
    if (searchParams.get('priceMin')) filter.priceMin = Number(searchParams.get('priceMin'));
    if (searchParams.get('priceMax')) filter.priceMax = Number(searchParams.get('priceMax'));
    if (searchParams.get('areaMin')) filter.areaMin = Number(searchParams.get('areaMin'));
    if (searchParams.get('areaMax')) filter.areaMax = Number(searchParams.get('areaMax'));
    if (searchParams.get('floor')) filter.floor = Number(searchParams.get('floor'));
    if (searchParams.get('floorMin')) filter.floorMin = Number(searchParams.get('floorMin'));
    if (searchParams.get('floorMax')) filter.floorMax = Number(searchParams.get('floorMax'));
    if (searchParams.get('keyword')) filter.keyword = searchParams.get('keyword') || undefined;
    if (searchParams.get('sortBy'))
      filter.sortBy = searchParams.get('sortBy') as ListingFilter['sortBy'];
    if (searchParams.get('sortOrder'))
      filter.sortOrder = searchParams.get('sortOrder') as ListingFilter['sortOrder'];
    if (searchParams.get('page')) filter.page = Number(searchParams.get('page'));
    if (searchParams.get('limit')) filter.limit = Number(searchParams.get('limit'));

    const result = await search.search(filter);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { myListing } = getServices();
    const body = await request.json();
    const listing = await myListing.create(body);
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
