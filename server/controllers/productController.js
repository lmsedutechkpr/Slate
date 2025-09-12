import { Product, Bundle } from '../models/index.js';
import { getIo } from '../realtime.js';

export const createProduct = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      price, 
      discountPrice, 
      stock, 
      specifications 
    } = req.body;
    
    const product = new Product({
      title,
      description,
      category,
      price,
      discountPrice,
      stock: stock || 0,
      specifications: specifications || {}
    });
    
    await product.save();
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create product',
      error: error.message
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice,
      page = 1, 
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions);
    
    const total = await Product.countDocuments(filter);
    
    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get products',
      error: error.message
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ product });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get product',
      error: error.message
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    try {
      if (product && typeof product.stock === 'number' && typeof product.lowStockThreshold === 'number' && product.stock <= product.lowStockThreshold) {
        getIo()?.emit('admin:inventory:low', { productId: product._id, stock: product.stock });
      }
    } catch {}
    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update product',
      error: error.message
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      { isActive: false },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

export const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    res.json({ categories });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get categories',
      error: error.message
    });
  }
};

export const getTrendingProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await Product.find({ isActive: true })
      .sort({ salesCount: -1, 'rating.average': -1, createdAt: -1 })
      .limit(parseInt(limit));
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get trending products', error: error.message });
  }
};

export const createBundle = async (req, res) => {
  try {
    const { title, description, courseId, products = [], price, discountPrice } = req.body;
    if (!title || !Array.isArray(products) || products.length === 0 || price == null) {
      return res.status(400).json({ message: 'title, products, and price are required' });
    }
    const bundle = await Bundle.create({ title, description, courseId, products, price, discountPrice });
    try { getIo()?.emit('admin:products:update', { type: 'bundle_created', id: bundle._id }); } catch {}
    res.status(201).json({ message: 'Bundle created', bundle });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create bundle', error: error.message });
  }
};

export const listBundles = async (req, res) => {
  try {
    const { courseId } = req.query;
    const filter = { isActive: true };
    if (courseId) filter.courseId = courseId;
    const bundles = await Bundle.find(filter).populate('courseId', 'title').populate('products.productId', 'title price discountPrice');
    res.json({ bundles });
  } catch (error) {
    res.status(500).json({ message: 'Failed to list bundles', error: error.message });
  }
};

export const updateBundle = async (req, res) => {
  try {
    const { bundleId } = req.params;
    const update = req.body || {};
    const bundle = await Bundle.findByIdAndUpdate(bundleId, update, { new: true });
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
    try { getIo()?.emit('admin:products:update', { type: 'bundle_updated', id: bundle._id }); } catch {}
    res.json({ message: 'Bundle updated', bundle });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update bundle', error: error.message });
  }
};

export const deleteBundle = async (req, res) => {
  try {
    const { bundleId } = req.params;
    const bundle = await Bundle.findByIdAndUpdate(bundleId, { isActive: false }, { new: true });
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
    try { getIo()?.emit('admin:products:update', { type: 'bundle_deleted', id: bundle._id }); } catch {}
    res.json({ message: 'Bundle deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete bundle', error: error.message });
  }
};
