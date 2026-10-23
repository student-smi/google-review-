import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Better Auth Tables (SQLite compatible)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
});

// ReviewQR Business Domain Tables
export const businesses = sqliteTable('businesses', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  googlePlaceId: text('google_place_id'),
  googleReviewUrl: text('google_review_url').notNull(),
  category: text('category'), // restaurant, retail, salon, healthcare, services
  phone: text('phone'),
  city: text('city'),
  logoUrl: text('logo_url'),
  brandVoice: text('brand_voice').default('warm_grateful').notNull(), // warm_grateful, professional, concise, enthusiastic
  brandColor: text('brand_color').default('#4338CA').notNull(), // Primary accent
  brandColorSecondary: text('brand_color_secondary').default('#D97706').notNull(), // Saffron accent
  contactResolutionLine: text('contact_resolution_line'), // offline resolution phone or email
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
}, (t) => [
  index('idx_businesses_owner').on(t.ownerId),
  index('idx_businesses_slug').on(t.slug)
]);

export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  address: text('address'),
  googleReviewUrl: text('google_review_url'),
  createdAt: integer('created_at').notNull()
}, (t) => [
  index('idx_locations_business').on(t.businessId)
]);

export const qrCodes = sqliteTable('qr_codes', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(), // Short code scanned by customer (e.g. /r/cafe101)
  label: text('label').notNull(), // e.g. "Main Cash Counter", "Table 1"
  destinationUrl: text('destination_url').notNull(), // Target review destination
  styleJson: text('style_json').notNull(), // JSON configuration for QR styling (dots, corners, colors)
  isActive: integer('is_active').default(1).notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
}, (t) => [
  uniqueIndex('idx_qr_codes_code').on(t.code),
  index('idx_qr_codes_business').on(t.businessId)
]);

export const scanDailyStats = sqliteTable('scan_daily_stats', {
  id: text('id').primaryKey(),
  qrId: text('qr_id').notNull().references(() => qrCodes.id, { onDelete: 'cascade' }),
  businessId: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  day: text('day').notNull(), // 'YYYY-MM-DD' UTC
  scanCount: integer('scan_count').default(0).notNull(),
  helpMeWriteCount: integer('help_me_write_count').default(0).notNull(),
  googleClickCount: integer('google_click_count').default(0).notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
}, (t) => [
  uniqueIndex('idx_scan_daily_qr_day').on(t.qrId, t.day),
  index('idx_scan_daily_business_day').on(t.businessId, t.day)
]);

export const scans = sqliteTable('scans', {
  id: text('id').primaryKey(),
  qrId: text('qr_id').notNull().references(() => qrCodes.id, { onDelete: 'cascade' }),
  businessId: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  deviceClass: text('device_class'), // mobile, desktop, tablet
  referrer: text('referrer'),
  createdAt: integer('created_at').notNull()
}, (t) => [
  index('idx_scans_qr').on(t.qrId),
  index('idx_scans_created').on(t.createdAt)
]);

export const aiDraftEvents = sqliteTable('ai_draft_events', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  language: text('language').notNull(), // en, hi, gu, hinglish
  tone: text('tone').notNull(),
  wordCount: integer('word_count').notNull(),
  copied: integer('copied').default(0).notNull(),
  createdAt: integer('created_at').notNull()
}, (t) => [
  index('idx_ai_draft_events_business').on(t.businessId)
]);

export const aiUsageDaily = sqliteTable('ai_usage_daily', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  day: text('day').notNull(), // 'YYYY-MM-DD'
  callCount: integer('call_count').default(0).notNull(),
  neuronEstimate: integer('neuron_estimate').default(0).notNull(),
  updatedAt: integer('updated_at').notNull()
}, (t) => [
  uniqueIndex('idx_ai_usage_business_day').on(t.businessId, t.day)
]);

export const replyDrafts = sqliteTable('reply_drafts', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  reviewSnippet: text('review_snippet'),
  rating: integer('rating'),
  replyText: text('reply_text').notNull(),
  style: text('style').notNull(), // warm, professional, concise
  createdAt: integer('created_at').notNull()
}, (t) => [
  index('idx_reply_drafts_business').on(t.businessId)
]);

export const seoChecklistItems = sqliteTable('seo_checklist_items', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  itemKey: text('item_key').notNull(),
  isCompleted: integer('is_completed').default(0).notNull(),
  notes: text('notes'),
  updatedAt: integer('updated_at').notNull()
}, (t) => [
  uniqueIndex('idx_seo_items_business_item').on(t.businessId, t.itemKey)
]);

export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(), // ip:YYYY-MM-DD-HH or token
  count: integer('count').default(0).notNull(),
  expiresAt: integer('expires_at').notNull()
}, (t) => [
  index('idx_rate_limits_expires').on(t.expiresAt)
]);

export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  category: text('category').default('general').notNull(),
  mimeType: text('mime_type').default('image/jpeg').notNull(),
  isRecommended: integer('is_recommended').default(1).notNull(),
  createdAt: integer('created_at').notNull()
}, (t) => [
  index('idx_media_assets_business').on(t.businessId)
]);

