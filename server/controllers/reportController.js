import { Order, UserActivity } from '../models/index.js';
import { getIo } from '../realtime.js';

function parseRange(from, to, daysDefault = 30) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - daysDefault * 24 * 60 * 60 * 1000);
  return { start, end };
}

export const salesReport = async (req, res) => {
  try {
    const { start, end } = parseRange(req.query.from, req.query.to, 30);
    const paid = await Order.aggregate([
      { $match: { status: { $in: ['paid', 'refunded'] }, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
    ]);
    const summary = await Order.aggregate([
      { $match: { status: { $in: ['paid', 'refunded'] }, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }
    ]);
    const result = { range: { from: start, to: end }, daily: paid, summary: summary[0] || { revenue: 0, orders: 0 } };
    res.json(result);
  } catch (error) { res.status(500).json({ message: 'Failed to get sales report', error: error.message }); }
};

export const userActivityReport = async (req, res) => {
  try {
    const { start, end } = parseRange(req.query.from, req.query.to, 30);
    const byType = await UserActivity.aggregate([
      { $match: { occurredAt: { $gte: start, $lte: end } } },
      { $group: { _id: { type: '$type', y: { $year: '$occurredAt' }, m: { $month: '$occurredAt' }, d: { $dayOfMonth: '$occurredAt' } }, value: { $sum: '$value' }, count: { $sum: 1 } } },
      { $sort: { '_id.type': 1, '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
    ]);
    res.json({ range: { from: start, to: end }, series: byType });
  } catch (error) { res.status(500).json({ message: 'Failed to get activity report', error: error.message }); }
};

export const exportSalesCsv = async (req, res) => {
  try {
    const { start, end } = parseRange(req.query.from, req.query.to, 30);
    const rows = await Order.find({ status: { $in: ['paid', 'refunded'] }, createdAt: { $gte: start, $lte: end } }).select('createdAt total status').lean();
    const header = ['createdAt','total','status'];
    const esc = (v) => {
      if (v == null) return '';
      const s = typeof v === 'string' ? v : (typeof v === 'object' ? JSON.stringify(v) : String(v));
      const needs = /[",\n]/.test(s);
      return needs ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [header.join(','), ...rows.map(r => [r.createdAt.toISOString(), r.total, r.status].map(esc).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales.csv"');
    res.send(csv);
  } catch (error) { res.status(500).json({ message: 'Failed to export sales', error: error.message }); }
};

export const exportActivityCsv = async (req, res) => {
  try {
    const { start, end } = parseRange(req.query.from, req.query.to, 30);
    const rows = await UserActivity.find({ occurredAt: { $gte: start, $lte: end } }).select('occurredAt type value').lean();
    const header = ['occurredAt','type','value'];
    const esc = (v) => {
      if (v == null) return '';
      const s = typeof v === 'string' ? v : (typeof v === 'object' ? JSON.stringify(v) : String(v));
      const needs = /[",\n]/.test(s);
      return needs ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [header.join(','), ...rows.map(r => [r.occurredAt.toISOString(), r.type, r.value].map(esc).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity.csv"');
    res.send(csv);
  } catch (error) { res.status(500).json({ message: 'Failed to export activity', error: error.message }); }
};


