import { AdminSettings } from '../models/index.js';

export const getSettings = async (_req, res) => {
  try {
    const doc = await AdminSettings.findOne({}).sort({ createdAt: -1 });
    res.json(doc || { roles: [], general: {}, security: {}, notifications: {} });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load settings', error: error.message });
  }
};

export const upsertSettings = async (req, res) => {
  try {
    const { roles, general, security, notifications } = req.body || {};
    const doc = await AdminSettings.findOne({});
    if (doc) {
      if (roles) doc.roles = roles;
      if (general) doc.general = general;
      if (security) doc.security = security;
      if (notifications) doc.notifications = notifications;
      await doc.save();
      // Realtime notify admins
      try { const { getIo } = await import('../realtime.js'); getIo()?.emit('admin:settings:update', { section: 'all' }); } catch {}
      return res.json({ message: 'Settings updated', settings: doc });
    }
    const created = await AdminSettings.create({ roles: roles || [], general, security, notifications });
    try { const { getIo } = await import('../realtime.js'); getIo()?.emit('admin:settings:update', { section: 'all' }); } catch {}
    res.status(201).json({ message: 'Settings saved', settings: created });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save settings', error: error.message });
  }
};

export const updateRoles = async (req, res) => {
  try {
    const { roles } = req.body || {};
    if (!Array.isArray(roles)) return res.status(400).json({ message: 'roles must be an array' });
    const doc = await AdminSettings.findOne({});
    if (doc) {
      doc.roles = roles;
      await doc.save();
      try { const { getIo } = await import('../realtime.js'); getIo()?.emit('admin:settings:update', { section: 'roles' }); } catch {}
      return res.json({ message: 'Roles updated', roles: doc.roles });
    }
    const created = await AdminSettings.create({ roles });
    try { const { getIo } = await import('../realtime.js'); getIo()?.emit('admin:settings:update', { section: 'roles' }); } catch {}
    res.status(201).json({ message: 'Roles saved', roles: created.roles });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update roles', error: error.message });
  }
};


