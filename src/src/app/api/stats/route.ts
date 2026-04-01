export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { SupabaseListingRepository } from '@/lib/db/supabase';

export async function GET() {
  try {
    const repo = new SupabaseListingRepository();
    const stats = await repo.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
