import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: String,
  category: {
    type: String,
    required: true
  },
  tags: [String],
  price: {
    type: Number,
    required: true
  },
  discountPrice: Number,
  stock: {
    type: Number,
    default: 0
  },
  images: [String],
  specifications: {
    type: Map,
    of: String
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  salesCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  }
}, {
  timestamps: true
});

productSchema.index({ salesCount: -1, 'rating.average': -1 });

// Generate slug before saving
productSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
