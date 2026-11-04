import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import type { DbClient } from './client';
import {
  businesses,
  qrCodes,
  scanDailyStats,
  scans,
  aiUsageDaily,
  seoChecklistItems,
  replyDrafts,
  locations,
  customerReviews,
  memberships
} from './schema';

export class ScopedAuthorizationError extends Error {
  constructor(message = 'Unauthorized: Access to resource denied') {
    super(message);
    this.name = 'ScopedAuthorizationError';
  }
}

export function createScopedDb(db: DbClient, ownerId: string) {
  if (!ownerId) {
    throw new ScopedAuthorizationError('Owner ID is required to instantiate scoped database access');
  }

  return {
    ownerId,

    // ──────────────────────────────────────────────
    // Businesses
    // ──────────────────────────────────────────────
    async getBusinesses() {
      return db
        .select()
        .from(businesses)
        .where(eq(businesses.ownerId, ownerId))
        .orderBy(desc(businesses.createdAt));
    },

    async getBusiness(businessId: string) {
      // 1. Direct ownership match
      const results = await db
        .select()
        .from(businesses)
        .where(and(eq(businesses.id, businessId), eq(businesses.ownerId, ownerId)))
        .limit(1);

      if (results[0]) return results[0];

      // 1b. Check if user is super admin
      if (ownerId === '104549098573635444181' || ownerId === 'admin_user') {
        const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
        if (biz) return biz;
      }

      // 1c. Check memberships table
      try {
        const [membership] = await db
          .select()
          .from(memberships)
          .where(and(eq(memberships.userId, ownerId), eq(memberships.status, 'active')))
          .limit(1);
        if (membership) {
          const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
          if (biz && (biz.brandId === membership.brandId || biz.id === membership.businessId)) {
            return biz;
          }
        }
      } catch {}

      // 2. Allow demo business (demo-biz-1) or unauthenticated/guest owner fallback
      if (businessId === 'demo-biz-1' || ownerId === 'owner-default' || ownerId === 'demo-owner-default') {
        const [biz] = await db
          .select()
          .from(businesses)
          .where(eq(businesses.id, businessId))
          .limit(1);
        if (biz) {
          return biz;
        }
      }

      return null;
    },

    async createBusiness(data: {
      id: string;
      name: string;
      slug: string;
      googlePlaceId?: string;
      googleReviewUrl: string;
      category?: string;
      phone?: string;
      address?: string;
      city?: string;
      logoUrl?: string;
      brandVoice?: string;
      brandColor?: string;
      brandColorSecondary?: string;
      contactResolutionLine?: string;
      contactEmail?: string;
      assignedManager?: string;
      isArchived?: boolean;
      status?: string;
      chipsJson?: string | null;
    }) {
      const now = Math.floor(Date.now() / 1000);
      const [created] = await db
        .insert(businesses)
        .values({
          ...data,
          ownerId,
          status: data.status || 'active',
          isArchived: data.isArchived ?? false,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      return created;
    },

    async updateBusiness(
      businessId: string,
      data: Partial<{
        name: string;
        googleReviewUrl: string;
        googlePlaceId: string;
        category: string;
        phone: string;
        address: string;
        city: string;
        logoUrl: string;
        brandVoice: string;
        brandColor: string;
        brandColorSecondary: string;
        contactResolutionLine: string;
        contactEmail: string;
        assignedManager: string;
        isArchived: boolean;
        isPrimary: boolean;
        status: string;
        chipsJson: string | null;
        brandId: string | null;
        businessType: string;
      }>
    ) {
      // Must verify ownership or allowed access first
      const existing = await this.getBusiness(businessId);
      if (!existing) {
        throw new ScopedAuthorizationError('Cannot update business: Not found or unauthorized');
      }

      const now = Math.floor(Date.now() / 1000);
      const [updated] = await db
        .update(businesses)
        .set({ ...data, updatedAt: now })
        .where(eq(businesses.id, businessId))
        .returning();

      return updated;
    },

    async deleteBusiness(businessId: string) {
      const existing = await this.getBusiness(businessId);
      if (!existing) {
        throw new ScopedAuthorizationError('Cannot delete business: Not found or unauthorized');
      }

      return db
        .delete(businesses)
        .where(and(eq(businesses.id, businessId), eq(businesses.ownerId, ownerId)));
    },

    // ──────────────────────────────────────────────
    // Locations (Multiple Google Locations per Business)
    // ──────────────────────────────────────────────
    async getLocations(businessId: string) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot view locations: Business unauthorized or not found');
      }

      return db
        .select()
        .from(locations)
        .where(eq(locations.businessId, businessId))
        .orderBy(desc(locations.createdAt));
    },

    async createLocation(
      businessId: string,
      data: {
        id: string;
        name: string;
        slug?: string;
        address?: string;
        city?: string;
        phone?: string;
        googlePlaceId?: string;
        googleReviewUrl?: string;
        status?: string;
        isPrimary?: boolean;
        assignedManager?: string;
        chipsJson?: string | null;
      }
    ) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot create location: Business unauthorized or not found');
      }

      const now = Math.floor(Date.now() / 1000);
      const [created] = await db
        .insert(locations)
        .values({
          ...data,
          businessId,
          status: data.status || 'active',
          isPrimary: data.isPrimary ?? false,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      return created;
    },

    async updateLocation(
      businessId: string,
      locationId: string,
      data: Partial<{
        name: string;
        address: string;
        city: string;
        phone: string;
        googlePlaceId: string;
        googleReviewUrl: string;
        status: string;
        isPrimary: boolean;
        assignedManager: string;
        chipsJson: string | null;
      }>
    ) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot update location: Business unauthorized or not found');
      }

      const now = Math.floor(Date.now() / 1000);
      const [updated] = await db
        .update(locations)
        .set({ ...data, updatedAt: now })
        .where(and(eq(locations.id, locationId), eq(locations.businessId, businessId)))
        .returning();

      return updated;
    },

    async deleteLocation(businessId: string, locationId: string) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot delete location: Business unauthorized or not found');
      }

      // Delete any associated QR codes first to avoid foreign key blocks
      try {
        await db.delete(qrCodes).where(eq(qrCodes.branchId, locationId));
      } catch {}

      return db
        .delete(locations)
        .where(and(eq(locations.id, locationId), eq(locations.businessId, businessId)));
    },

    // ──────────────────────────────────────────────
    // QR Codes
    // ──────────────────────────────────────────────
    async getQrCodes(businessId: string) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot view QR codes: Business unauthorized or not found');
      }

      return db
        .select()
        .from(qrCodes)
        .where(eq(qrCodes.businessId, businessId))
        .orderBy(desc(qrCodes.createdAt));
    },

    async getQrCode(qrId: string) {
      // Join on business to verify owner owns this QR code
      const results = await db
        .select({
          qr: qrCodes,
          business: businesses
        })
        .from(qrCodes)
        .innerJoin(businesses, eq(qrCodes.businessId, businesses.id))
        .where(and(eq(qrCodes.id, qrId), eq(businesses.ownerId, ownerId)))
        .limit(1);

      return results[0]?.qr || null;
    },

    async createQrCode(businessId: string, data: {
      id: string;
      code: string;
      label: string;
      destinationUrl: string;
      styleJson: string;
    }) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot create QR code for unauthorized business');
      }

      const now = Math.floor(Date.now() / 1000);
      const [created] = await db
        .insert(qrCodes)
        .values({
          ...data,
          businessId,
          isActive: 1,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      return created;
    },

    async updateQrCode(
      qrId: string,
      data: Partial<{
        code: string;
        label: string;
        destinationUrl: string;
        styleJson: string;
        isActive: number;
      }>
    ) {
      const existing = await this.getQrCode(qrId);
      if (!existing) {
        throw new ScopedAuthorizationError('Cannot update QR code: Not found or unauthorized');
      }

      const now = Math.floor(Date.now() / 1000);
      const [updated] = await db
        .update(qrCodes)
        .set({ ...data, updatedAt: now })
        .where(eq(qrCodes.id, qrId))
        .returning();

      return updated;
    },

    async deleteQrCode(qrId: string) {
      const existing = await this.getQrCode(qrId);
      if (!existing) {
        throw new ScopedAuthorizationError('Cannot delete QR code: Not found or unauthorized');
      }

      return db.delete(qrCodes).where(eq(qrCodes.id, qrId));
    },

    // ──────────────────────────────────────────────
    // Analytics & Stats
    // ──────────────────────────────────────────────
    async getDailyAnalytics(businessId: string, limitDays = 30) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot view analytics: Unauthorized business');
      }

      return db
        .select()
        .from(scanDailyStats)
        .where(eq(scanDailyStats.businessId, businessId))
        .orderBy(desc(scanDailyStats.day))
        .limit(limitDays);
    },

    async getUsageAndLimits(businessId: string) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot view limits: Unauthorized business');
      }

      const today = new Date().toISOString().split('T')[0];
      const [aiUsage] = await db
        .select()
        .from(aiUsageDaily)
        .where(and(eq(aiUsageDaily.businessId, businessId), eq(aiUsageDaily.day, today)))
        .limit(1);

      const [todayStats] = await db
        .select({
          totalScans: sql<number>`sum(${scanDailyStats.scanCount})`,
          totalDrafts: sql<number>`sum(${scanDailyStats.helpMeWriteCount})`,
          totalGoogleClicks: sql<number>`sum(${scanDailyStats.googleClickCount})`
        })
        .from(scanDailyStats)
        .where(and(eq(scanDailyStats.businessId, businessId), eq(scanDailyStats.day, today)));

      return {
        today,
        aiCallsToday: aiUsage?.callCount ?? 0,
        aiDailyCap: 25, // Free tier default cap per business
        scansToday: Number(todayStats?.totalScans ?? 0),
        draftsToday: Number(todayStats?.totalDrafts ?? 0),
        googleClicksToday: Number(todayStats?.totalGoogleClicks ?? 0)
      };
    },

    // ──────────────────────────────────────────────
    // SEO Checklist
    // ──────────────────────────────────────────────
    async getSeoChecklist(businessId: string) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot access SEO checklist: Unauthorized business');
      }

      return db
        .select()
        .from(seoChecklistItems)
        .where(eq(seoChecklistItems.businessId, businessId));
    },

    async toggleSeoItem(businessId: string, itemKey: string, isCompleted: boolean, notes?: string) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot update SEO checklist: Unauthorized business');
      }

      const now = Math.floor(Date.now() / 1000);
      const existing = await db
        .select()
        .from(seoChecklistItems)
        .where(and(eq(seoChecklistItems.businessId, businessId), eq(seoChecklistItems.itemKey, itemKey)))
        .limit(1);

      if (existing.length > 0) {
        return db
          .update(seoChecklistItems)
          .set({
            isCompleted: isCompleted ? 1 : 0,
            notes: notes !== undefined ? notes : existing[0].notes,
            updatedAt: now
          })
          .where(eq(seoChecklistItems.id, existing[0].id))
          .returning();
      } else {
        const id = `seo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        return db
          .insert(seoChecklistItems)
          .values({
            id,
            businessId,
            itemKey,
            isCompleted: isCompleted ? 1 : 0,
            notes: notes || '',
            updatedAt: now
          })
          .returning();
      }
    },

    // ──────────────────────────────────────────────
    // Review & Reply Drafts
    // ──────────────────────────────────────────────
    async getReplyDrafts(businessId: string) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot get reply drafts: Unauthorized business');
      }

      return db
        .select()
        .from(replyDrafts)
        .where(eq(replyDrafts.businessId, businessId))
        .orderBy(desc(replyDrafts.createdAt))
        .limit(50);
    },

    async saveReplyDraft(businessId: string, data: {
      reviewSnippet?: string;
      rating?: number;
      replyText: string;
      style: string;
    }) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot save reply draft: Unauthorized business');
      }

      const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = Math.floor(Date.now() / 1000);

      const [saved] = await db
        .insert(replyDrafts)
        .values({
          id,
          businessId,
          ...data,
          createdAt: now
        })
        .returning();

      return saved;
    },

    // ──────────────────────────────────────────────
    // Customer Reviews & AI Replies
    // ──────────────────────────────────────────────
    async getCustomerReviews(businessId: string) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot get customer reviews: Unauthorized business');
      }

      return db
        .select()
        .from(customerReviews)
        .where(eq(customerReviews.businessId, businessId))
        .orderBy(desc(customerReviews.createdAt))
        .limit(100);
    },

    async updateCustomerReviewReply(businessId: string, reviewId: string, data: {
      replyText: string;
      replyStyle?: string;
    }) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot reply to review: Unauthorized business');
      }

      const now = Math.floor(Date.now() / 1000);
      const [updated] = await db
        .update(customerReviews)
        .set({
          replyText: data.replyText,
          replyStyle: data.replyStyle || 'warm',
          repliedAt: now
        })
        .where(and(eq(customerReviews.id, reviewId), eq(customerReviews.businessId, businessId)))
        .returning();

      return updated;
    },

    async updateCustomerReview(businessId: string, reviewId: string, data: {
      customerName?: string;
      rating?: number;
      reviewText?: string;
    }) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot update review: Unauthorized business');
      }

      const patchData: Record<string, any> = {};
      if (typeof data.customerName === 'string') patchData.customerName = data.customerName.trim();
      if (typeof data.rating === 'number') patchData.rating = data.rating;
      if (typeof data.reviewText === 'string') patchData.reviewText = data.reviewText.trim();

      const [updated] = await db
        .update(customerReviews)
        .set(patchData)
        .where(and(eq(customerReviews.id, reviewId), eq(customerReviews.businessId, businessId)))
        .returning();

      return updated;
    },

    async deleteCustomerReview(businessId: string, reviewId: string) {
      const business = await this.getBusiness(businessId);
      if (!business) {
        throw new ScopedAuthorizationError('Cannot delete review: Unauthorized business');
      }

      await db
        .delete(customerReviews)
        .where(and(eq(customerReviews.id, reviewId), eq(customerReviews.businessId, businessId)));

      return { success: true };
    }
  };
}

export type ScopedDb = ReturnType<typeof createScopedDb>;
