import { Router } from 'express';
import pocketbaseClient from '../utils/pocketbaseClient.js';

const router = Router();

// GET /ads?placement=dashboard - get active ads for a placement
router.get('/ads', async (req, res) => {
  const { placement } = req.query;
  const pb = pocketbaseClient;

  const filter = placement
    ? `active = true && (placement = "${placement}" || placement = "all")`
    : 'active = true';

  const ads = await pb.collection('ads').getFullList({ filter, sort: '-created' });
  res.json({ ads });
});

// POST /ads/impression - track an impression
router.post('/ads/impression', async (req, res) => {
  const { adId, userId, placement } = req.body;
  if (!adId) return res.status(422).json({ error: 'adId is required' });

  const pb = pocketbaseClient;

  // Increment impressions counter (fire-and-forget style)
  pb.collection('ad_impressions')
    .create({ ad_id: adId, user_id: userId || '', placement: placement || '' })
    .catch(() => {});

  // Also increment counter on ad itself
  try {
    const ad = await pb.collection('ads').getOne(adId);
    await pb.collection('ads').update(adId, { impressions: (ad.impressions || 0) + 1 });
  } catch (_) {}

  res.json({ ok: true });
});

// GET /ads/all - admin list all ads
router.get('/ads/all', async (req, res) => {
  const pb = pocketbaseClient;
  const ads = await pb.collection('ads').getFullList({ sort: '-created' });
  res.json({ ads });
});

// POST /ads - admin create ad
router.post('/ads', async (req, res) => {
  const { title, image_url, link_url, placement, active } = req.body;
  if (!title || !image_url || !link_url) {
    return res.status(422).json({ error: 'title, image_url and link_url are required' });
  }
  const pb = pocketbaseClient;
  const ad = await pb.collection('ads').create({
    title,
    image_url,
    link_url,
    placement: placement || 'all',
    active: active !== false,
    impressions: 0,
  });
  res.status(201).json({ ad });
});

// PATCH /ads/:id - admin toggle/update ad
router.patch('/ads/:id', async (req, res) => {
  const pb = pocketbaseClient;
  const ad = await pb.collection('ads').update(req.params.id, req.body);
  res.json({ ad });
});

// DELETE /ads/:id - admin delete ad
router.delete('/ads/:id', async (req, res) => {
  const pb = pocketbaseClient;
  await pb.collection('ads').delete(req.params.id);
  res.json({ ok: true });
});

export default router;
