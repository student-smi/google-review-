import { Hono } from 'hono';
import { getDb } from '../db/client';
import { createScopedDb } from '../db/scoped';
import type { Env } from './public';

export const qrRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string } }>();

// List QR codes for a business
qrRoutes.get('/business/:businessId', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('businessId');
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    const list = await scoped.getQrCodes(businessId);
    return c.json({ qrCodes: list });
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
