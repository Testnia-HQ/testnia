import { Router } from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = Router();

// GET /support/admin/tickets — list all tickets with latest message preview
router.get('/support/admin/tickets', async (req, res) => {
  try {
    
    const { status, search } = req.query;
    const filters = [];
    if (status && status !== 'all') filters.push(pb.filter('status = {:s}', { s: status }));
    if (search) filters.push(pb.filter('subject_line ~ {:q}', { q: search }));
    const filter = filters.join(' && ') || undefined;
    const tickets = await pb.collection('support_tickets').getList(1, 100, {
      filter,
      sort: '-created',
      expand: 'user',
    });
    res.json(tickets);
  } catch (err) {
    logger.error('admin tickets list error', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /support/admin/tickets/:id — single ticket + all messages
router.get('/support/admin/tickets/:id', async (req, res) => {
  try {
    
    const ticket = await pb.collection('support_tickets').getOne(req.params.id, { expand: 'user' });
    const messages = await pb.collection('ticket_messages').getFullList({
      filter: `ticket = "${req.params.id}"`,
      sort: 'created',
    });
    res.json({ ticket, messages });
  } catch (err) {
    logger.error('admin ticket detail error', err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// POST /support/admin/tickets/:id/reply — admin posts a message
router.post('/support/admin/tickets/:id/reply', async (req, res) => {
  try {
    
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'body required' });
    const msg = await pb.collection('ticket_messages').create({
      ticket: req.params.id,
      sender_role: 'admin',
      body: body.trim(),
    });
    // set ticket to pending if it was open
    const ticket = await pb.collection('support_tickets').getOne(req.params.id);
    if (ticket.status === 'open') {
      await pb.collection('support_tickets').update(req.params.id, { status: 'pending' });
    }
    res.json(msg);
  } catch (err) {
    logger.error('admin ticket reply error', err);
    res.status(500).json({ error: 'Failed to post reply' });
  }
});

// PATCH /support/admin/tickets/:id/status
router.patch('/support/admin/tickets/:id/status', async (req, res) => {
  try {
    
    const { status } = req.body;
    const update = { status };
    if (status === 'closed') update.resolved_at = new Date().toISOString();
    const ticket = await pb.collection('support_tickets').update(req.params.id, update);
    res.json(ticket);
  } catch (err) {
    logger.error('admin ticket status error', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
