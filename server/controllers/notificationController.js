// Simple in-memory notifications for demo. Replace with DB/pubsub in production.
const notifications = [];

export const publish = async (req, res) => {
  try {
    const { title, message, level = 'info' } = req.body || {};
    if (!title && !message) return res.status(400).json({ message: 'title or message required' });
    const note = { id: Date.now().toString(), title: title || 'Notification', message: message || '', level, createdAt: Date.now() };
    notifications.push(note);
    // Trim to last 200
    if (notifications.length > 200) notifications.splice(0, notifications.length - 200);
    res.json({ message: 'published', notification: note });
  } catch (e) {
    res.status(500).json({ message: 'Failed to publish', error: e.message });
  }
};

export const list = async (req, res) => {
  try {
    const since = parseInt(req.query.since || '0', 10);
    const items = notifications.filter(n => n.createdAt > since);
    res.json({ notifications: items, now: Date.now() });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: e.message });
  }
};


