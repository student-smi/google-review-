-- ReviewQR Seed SQL
-- 1. Demo Business Owner
INSERT OR IGNORE INTO users (id, name, email, email_verified, created_at, updated_at)
VALUES (
  'demo-owner-default',
  'Rajesh Sharma',
  'rajesh@royalsweets.in',
  1,
  strftime('%s','now'),
  strftime('%s','now')
);

-- 2. Demo Business Profile (Royal Sweets & Bakery)
INSERT OR IGNORE INTO businesses (
  id,
  owner_id,
  name,
  slug,
  google_review_url,
  category,
  city,
  phone,
  brand_voice,
  brand_color,
  brand_color_secondary,
  contact_resolution_line,
  created_at,
  updated_at
) VALUES (
  'demo-biz-1',
  'demo-owner-default',
  'Royal Sweets & Bakery',
  'royal-sweets',
  'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
  'restaurant',
  'Ahmedabad',
  '+91 98765 43210',
  'warm_grateful',
  '#4338CA',
  '#D97706',
  '+91 98765 43210 (Mr. Rajesh)',
  strftime('%s','now'),
  strftime('%s','now')
);

-- 3. Dynamic QR Codes
INSERT OR IGNORE INTO qr_codes (
  id,
  business_id,
  code,
  label,
  destination_url,
  style_json,
  is_active,
  created_at,
  updated_at
) VALUES (
  'qr-demo-1',
  'demo-biz-1',
  'royal-counter',
  'Main Billing Counter',
  'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
  '{"dots":"rounded","color":"#4338CA"}',
  1,
  strftime('%s','now'),
  strftime('%s','now')
);
