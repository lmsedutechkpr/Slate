import { AuditLog, User } from '../models/index.js';

// Get all audit logs with filtering and pagination
export const getAllAuditLogs = async (req, res) => {
  try {
    const {
      search,
      action,
      user,
      dateRange,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = req.query;

    console.log('Fetching audit logs with filters:', {
      search, action, user, dateRange, page, limit, sortBy, sortDir
    });

    // Build filter object
    const filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { actorUsername: { $regex: search, $options: 'i' } },
        { actorEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Action filter
    if (action && action !== 'all') {
      filter.action = action;
    }

    // User filter
    if (user && user !== 'all') {
      filter.actorId = user;
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortDir === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const total = await AuditLog.countDocuments(filter);

    // Get audit logs with pagination
    const logs = await AuditLog.find(filter)
      .populate('actorId', 'username email firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayCount, weekCount, monthCount] = await Promise.all([
      AuditLog.countDocuments({ createdAt: { $gte: today } }),
      AuditLog.countDocuments({ createdAt: { $gte: weekAgo } }),
      AuditLog.countDocuments({ createdAt: { $gte: monthAgo } })
    ]);

    const stats = {
      total,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount
    };

    const response = {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    };

    console.log('Audit logs fetched:', {
      logsCount: logs.length,
      total,
      stats
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};

// Get audit log by ID
export const getAuditLogById = async (req, res) => {
  try {
    const { logId } = req.params;
    
    const log = await AuditLog.findById(logId)
      .populate('actorId', 'username email firstName lastName');
    
    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json({ log });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
};

// Clear old audit logs
export const clearAuditLogs = async (req, res) => {
  try {
    const { olderThan } = req.body;
    const adminId = req.user._id;

    console.log(`Clearing audit logs older than: ${olderThan} by admin: ${adminId}`);

    let cutoffDate;
    switch (olderThan) {
      case '30days':
        cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return res.status(400).json({ message: 'Invalid olderThan value' });
    }

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    console.log(`Cleared ${result.deletedCount} audit logs`);

    // Log the cleanup action
    await AuditLog.create({
      action: 'audit:cleanup',
      actorId: adminId,
      actorRole: req.user.role,
      actorUsername: req.user.username,
      actorEmail: req.user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      description: `Cleared ${result.deletedCount} audit logs older than ${olderThan}`,
      meta: {
        deletedCount: result.deletedCount,
        cutoffDate: cutoffDate.toISOString()
      }
    });

    res.json({
      message: 'Audit logs cleared successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing audit logs:', error);
    res.status(500).json({
      message: 'Failed to clear audit logs',
      error: error.message
    });
  }
};

// Export audit logs
export const exportAuditLogs = async (req, res) => {
  try {
    const {
      search,
      action,
      user,
      dateRange,
      format = 'csv'
    } = req.query;

    console.log('Exporting audit logs:', { search, action, user, dateRange, format });

    // Build filter object (same as getAllAuditLogs)
    const filter = {};

    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { actorUsername: { $regex: search, $options: 'i' } },
        { actorEmail: { $regex: search, $options: 'i' } }
      ];
    }

    if (action && action !== 'all') {
      filter.action = action;
    }

    if (user && user !== 'all') {
      filter.actorId = user;
    }

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    // Get audit logs
    const logs = await AuditLog.find(filter)
      .populate('actorId', 'username email firstName lastName')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Timestamp,Action,User,Email,Description,IP Address,Status\n';
      const csvRows = logs.map(log => {
        const timestamp = new Date(log.createdAt).toISOString();
        const user = log.actorUsername || 'System';
        const email = log.actorEmail || '';
        const description = (log.description || '').replace(/"/g, '""');
        const ip = log.ip || '';
        const status = log.status || 'success';
        
        return `"${timestamp}","${log.action}","${user}","${email}","${description}","${ip}","${status}"`;
      }).join('\n');

      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else {
      res.json({ logs });
    }
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      message: 'Failed to export audit logs',
      error: error.message
    });
  }
};

// Get audit log statistics
export const getAuditStats = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get action counts
    const actionStats = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get user activity
    const userStats = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$actorId', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get daily activity
    const dailyStats = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      actionStats,
      userStats,
      dailyStats,
      period: days
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      message: 'Failed to fetch audit statistics',
      error: error.message
    });
  }
};
