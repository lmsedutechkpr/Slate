import { Order, Payment, TransactionLog } from '../models/index.js';
import { getIo } from '../realtime.js';

export const createOrder = async (req, res) => {
  try {
    const { items, currency = 'INR', discount = 0, tax = 0 } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }
    const subtotal = items.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
    const total = Math.max(0, subtotal - (discount || 0) + (tax || 0));

    const order = await Order.create({
      userId: req.user._id,
      items: items.map(i => ({ ...i, quantity: i.quantity || 1 })),
      subtotal,
      discount,
      tax,
      total,
      currency,
      status: 'pending'
    });

    await TransactionLog.create({ orderId: order._id, type: 'order_created', amount: total });

    try { const io = getIo(); if (io) io.emit('orders:new', { id: order._id, total }); } catch (_) {}

    res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

export const capturePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { provider = 'manual', providerPaymentId, amount, currency = 'INR', method } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const payment = await Payment.create({
      orderId: order._id,
      provider,
      providerPaymentId,
      amount: amount ?? order.total,
      currency,
      status: 'captured',
      method,
      capturedAt: new Date()
    });

    order.status = 'paid';
    order.paymentId = payment._id;
    await order.save();

    await TransactionLog.create({ orderId: order._id, paymentId: payment._id, type: 'payment_captured', amount: payment.amount });

    try { const io = getIo(); if (io) io.emit('orders:paid', { id: order._id, amount: payment.amount }); } catch (_) {}
    try { const io = getIo(); if (io) io.emit('admin:reports:update', { type: 'sales' }); } catch (_) {}

    res.json({ message: 'Payment captured', order, payment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to capture payment', error: error.message });
  }
};

export const listOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find({}).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Order.countDocuments({})
    ]);
    res.json({ orders, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to list orders', error: error.message });
  }
};


