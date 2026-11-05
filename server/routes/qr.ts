import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/client';
import { createScopedDb } from '../db/scoped';
import { memberships, locations, qrCodes } from '../db/schema';
import type { Env } from './public';

export const qrRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string } }>();

// List QR codes for a business with aggregated scan stats
qrRoutes.get('/business/:businessId', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('businessId');
  const branchId = c.req.query('branchId');
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    let effectiveBranchId = branchId;
    let isExecutive = false;

    try {
      const [mem] = await db
        .select()
        .from(memberships)
        .where(and(eq(memberships.userId, ownerId), eq(memberships.status, 'active')))
        .limit(1);

      if (mem && (mem.role === 'review_executive' || mem.role === 'branch_manager') && mem.branchId) {
        effectiveBranchId = mem.branchId;
        isExecutive = true;
      }
    } catch {}

    let list = await scoped.getQrCodes(businessId);

    // If a branch is requested or caller is scoped to a branch, ensure branch QR exists
    if (effectiveBranchId) {
      let branchQrs = list.filter((q: any) => q.branchId === effectiveBranchId);
      if (branchQrs.length === 0) {
        try {
          const [loc] = await db.select().from(locations).where(eq(locations.id, effectiveBranchId)).limit(1);
          if (loc) {
            const qrId = `qr_${loc.id}`;
            const qrCodeValue = `qr_${loc.slug || loc.id}`;
            const now = Math.floor(Date.now() / 1000);
            await db.insert(qrCodes).values({
              id: qrId,
              businessId: businessId,
              branchId: loc.id,
              code: qrCodeValue,
              label: `${loc.name} Standee QR`,
              destinationUrl: `/r/${loc.slug || loc.id}`,
              styleJson: JSON.stringify({ dots: 'rounded', color: '#2563EB' }),
              isActive: 1,
              createdAt: now,
              updatedAt: now
            }).onConflictDoNothing();
            list = await scoped.getQrCodes(businessId);
            branchQrs = list.filter((q: any) => q.branchId === effectiveBranchId);
          }
        } catch (createErr) {
          console.warn('Branch QR auto-creation fallback notice:', createErr);
        }
      }

      // If user is executive, only return their branch QR code!
      if (isExecutive && branchQrs.length > 0) {
        list = branchQrs;
      } else if (branchQrs.length > 0) {
        // Place branch QR first
        const others = list.filter((q: any) => q.branchId !== effectiveBranchId);
        list = [...branchQrs, ...others];
      }
    }
    let statsByQr: Record<string, { scans: number; drafts: number; googleClicks: number }> = {};
    try {
      const dailyStats = await scoped.getDailyAnalytics(businessId, 365);
      for (const stat of dailyStats) {
        if (!statsByQr[stat.qrId]) {
          statsByQr[stat.qrId] = { scans: 0, drafts: 0, googleClicks: 0 };
        }
        statsByQr[stat.qrId].scans += stat.scanCount || 0;
        statsByQr[stat.qrId].drafts += stat.helpMeWriteCount || 0;
        statsByQr[stat.qrId].googleClicks += stat.googleClickCount || 0;
      }
    } catch {}

    const enhanced = list.map(q => ({
      ...q,
      scans: statsByQr[q.id]?.scans || 0,
      drafts: statsByQr[q.id]?.drafts || 0,
      googleClicks: statsByQr[q.id]?.googleClicks || 0
    }));

    return c.json({ qrCodes: enhanced });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});

// Create dynamic QR code
qrRoutes.post('/business/:businessId', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('businessId');
  const body = await c.req.json();
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    const business = await scoped.getBusiness(businessId);
    if (!business) {
      return c.json({ error: 'Business not found or unauthorized' }, 404);
    }

    const id = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    // Generate clean shortcode or use provided one
    const code = (body.code || Math.random().toString(36).substring(2, 8))
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '');

    const label = body.label || 'Main Counter';
    const destinationUrl = business.googleReviewUrl;
    const styleJson = typeof body.styleJson === 'string' 
      ? body.styleJson 
      : JSON.stringify(body.styleJson || {
          dots: 'rounded',
          cornersSquare: 'extra-rounded',
          cornersDot: 'dot',
          color: business.brandColor || '#4338CA'
        });

    // Safely UPSERT to prevent unique constraint crash on duplicate saves
    const existingList = await scoped.getQrCodes(businessId);
    const existingTarget =
      existingList.find(q => q.code === code) ||
      (body.qrId ? existingList.find(q => q.id === body.qrId) : null) ||
      (existingList.length === 1 ? existingList[0] : null);

    let qr: any;
    if (existingTarget) {
      qr = await scoped.updateQrCode(existingTarget.id, {
        code,
        label,
        destinationUrl,
        styleJson
      });
    } else {
      qr = await scoped.createQrCode(businessId, {
        id,
        code,
        label,
        destinationUrl,
        styleJson
      });
    }

    // Write to KV read cache ONLY on creation (never per request)
    if (c.env.KV) {
      const kvPayload = {
        id: qr.id,
        code: qr.code,
        label: qr.label,
        businessId: business.id,
        businessName: business.name,
        googleReviewUrl: business.googleReviewUrl,
        logoUrl: business.logoUrl,
        brandColor: business.brandColor,
        brandColorSecondary: business.brandColorSecondary,
        styleJson: qr.styleJson
      };

      try {
        await c.env.KV.put(`qr:${code}`, JSON.stringify(kvPayload));
      } catch (kvErr) {
        console.warn('Failed to populate KV cache on QR create:', kvErr);
      }
    }

    return c.json({ qrCode: qr }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// Update QR code styling or destination
qrRoutes.patch('/:qrId', async (c) => {
  const ownerId = c.get('ownerId');
  const qrId = c.req.param('qrId');
  const body = await c.req.json();
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    const existing = await scoped.getQrCode(qrId);
    if (!existing) {
      return c.json({ error: 'QR Code not found or unauthorized' }, 404);
    }

    const updated = await scoped.updateQrCode(qrId, body);

    // Refresh KV cache when destination or style changes
    if (c.env.KV && updated) {
      const business = await scoped.getBusiness(updated.businessId);
      if (business) {
        const kvPayload = {
          id: updated.id,
          code: updated.code,
          label: updated.label,
          businessId: business.id,
          businessName: business.name,
          googleReviewUrl: updated.destinationUrl || business.googleReviewUrl,
          logoUrl: business.logoUrl,
          brandColor: business.brandColor,
          brandColorSecondary: business.brandColorSecondary,
          styleJson: updated.styleJson
        };
        await c.env.KV.put(`qr:${updated.code}`, JSON.stringify(kvPayload));
      }
    }

    return c.json({ qrCode: updated });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});

// Delete QR code
qrRoutes.delete('/:qrId', async (c) => {
  const ownerId = c.get('ownerId');
  const qrId = c.req.param('qrId');
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    const existing = await scoped.getQrCode(qrId);
    if (!existing) {
      return c.json({ error: 'QR Code not found or unauthorized' }, 404);
    }

    await scoped.deleteQrCode(qrId);

    // Invalidate KV cache
    if (c.env.KV) {
      try {
        await c.env.KV.delete(`qr:${existing.code}`);
      } catch (kvErr) {
        console.warn('Failed to delete KV key:', kvErr);
      }
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});
