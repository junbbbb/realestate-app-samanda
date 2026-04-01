export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseListingRepository } from '@/lib/db/supabase';
import { ListingSearchService } from '@/services/listing-search';
import { MyListingService } from '@/services/my-listing';

function getServices() {
  const repo = new SupabaseListingRepository();
  return {
    search: new ListingSearchService(repo),
    myListing: new MyListingService(repo),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { search } = getServices();
    const listing = await search.getDetail(params.id);
    if (!listing) {
      return NextResponse.json({ error: '매물을 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json(listing);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { myListing } = getServices();
    const body = await request.json();
    const listing = await myListing.update(params.id, body);
    return NextResponse.json(listing);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { myListing } = getServices();
    await myListing.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
