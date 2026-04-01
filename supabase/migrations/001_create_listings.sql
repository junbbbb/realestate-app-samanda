-- 매물 테이블
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(10) NOT NULL DEFAULT 'manual' CHECK (source IN ('naver', 'manual')),
  type VARCHAR(10) NOT NULL CHECK (type IN ('store', 'building')),
  trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('sale', 'lease')),
  address TEXT NOT NULL,
  address_detail TEXT,
  floor INTEGER,
  total_floors INTEGER,
  price BIGINT NOT NULL DEFAULT 0,
  deposit BIGINT,
  monthly_rent BIGINT,
  area DECIMAL(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(15) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'contracted', 'closed')),
  naver_article_no VARCHAR(50) UNIQUE,
  scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_trade_type ON listings(trade_type);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_area ON listings(area);
CREATE INDEX IF NOT EXISTS idx_listings_floor ON listings(floor);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_naver_article_no ON listings(naver_article_no);

-- RLS (Row Level Security) - 모든 사용자가 읽기 가능
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON listings
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON listings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON listings
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON listings
  FOR DELETE USING (true);
