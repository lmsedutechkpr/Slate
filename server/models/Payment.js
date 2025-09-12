import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  provider: { type: String, enum: ['razorpay', 'stripe', 'paypal', 'manual'], default: 'manual' },
  providerPaymentId: String,
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'authorized', 'captured', 'failed', 'refunded'], default: 'created' },
  method: { type: String },
  capturedAt: Date,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;


