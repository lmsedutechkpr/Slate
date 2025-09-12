import mongoose from 'mongoose';

const productRefSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1, min: 1 }
}, { _id: false });

const bundleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  products: { type: [productRefSchema], validate: v => Array.isArray(v) && v.length > 0 },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

bundleSchema.index({ courseId: 1, createdAt: -1 });

const ProductBundle = mongoose.model('ProductBundle', bundleSchema);
export default ProductBundle;


