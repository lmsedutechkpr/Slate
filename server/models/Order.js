import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['course', 'product'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'items.refModel'
  },
  refModel: {
    type: String,
    enum: ['Course', 'Product'],
    required: true
  },
  title: String,
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: {
    type: [orderItemSchema],
    validate: v => Array.isArray(v) && v.length > 0
  },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;


