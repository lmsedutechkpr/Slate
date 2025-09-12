import mongoose from 'mongoose';

const transactionLogSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  type: { type: String, enum: ['order_created', 'payment_authorized', 'payment_captured', 'payment_failed', 'refund', 'order_cancelled'], required: true },
  amount: { type: Number, default: 0 },
  message: { type: String },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

transactionLogSchema.index({ createdAt: -1 });
transactionLogSchema.index({ type: 1, createdAt: -1 });

const TransactionLog = mongoose.model('TransactionLog', transactionLogSchema);
export default TransactionLog;


