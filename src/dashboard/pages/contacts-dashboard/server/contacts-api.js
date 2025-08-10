// server/contacts-api.js
const express = require('express');
const { createClient, ApiKeyStrategy } = require('@wix/sdk');
const { contacts } = require('@wix/crm');

const router = express.Router();

const wix = createClient({
  modules: { contacts },
  auth: ApiKeyStrategy({ apiKey: process.env.WIX_API_KEY }),
});

// GET /api/contacts  → list
router.get('/api/contacts', async (_req, res) => {
  try {
    const result = await wix.contacts.queryContacts().find();
    res.json({ items: result.items || [] });
  } catch (e) {
    console.error('LIST error:', e);
    res.status(500).json({ error: 'Failed listing contacts' });
  }
});

// POST /api/contacts  { name, email?, phone? } → create
router.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone } = req.body || {};
    const [first, ...rest] = (name || '').trim().split(/\s+/);
    if (!first) return res.status(400).json({ error: 'name is required' });
    const last = rest.join(' ');

    const info = {
      name: { first, last },
      emails: email ? { items: [{ email, primary: true }] } : undefined,
      phones: phone ? { items: [{ phone, primary: true }] } : undefined,
    };

    const created = await wix.contacts.createContact({ info });
    res.json(created);
  } catch (e) {
    console.error('CREATE error:', e);
    res.status(500).json({ error: 'Failed creating contact' });
  }
});

// PATCH /api/contacts/:id  { name, email?, phone? } → update
router.patch('/api/contacts/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, phone } = req.body || {};

    const current = await wix.contacts.getContact(id);
    const revision = current?.contact?.revision ?? 0;

    const [first, ...rest] = (name || '').trim().split(/\s+/);
    if (!first) return res.status(400).json({ error: 'name is required' });
    const last = rest.join(' ');

    const updatedInfo = {
      name: { first, last },
      emails: email ? { items: [{ email, primary: true }] } : undefined,
      phones: phone ? { items: [{ phone, primary: true }] } : undefined,
    };

    const updated = await wix.contacts.updateContact(id, { info: updatedInfo }, revision);
    res.json(updated);
  } catch (e) {
    console.error('UPDATE error:', e);
    res.status(500).json({ error: 'Failed updating contact' });
  }
});

// DELETE /api/contacts/:id  → archive (soft delete)
router.delete('/api/contacts/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const current = await wix.contacts.getContact(id);
    const revision = current?.contact?.revision ?? 0;
    const archived = await wix.contacts.archiveContact(id, revision);
    res.json(archived);
  } catch (e) {
    console.error('DELETE error:', e);
    res.status(500).json({ error: 'Failed deleting contact' });
  }
});

module.exports = router;
