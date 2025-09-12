import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edutech_lms';
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Lightweight startup migrations for new fields/indexes
    try {
      const { User, Product } = await import('./models/index.js');
      await User.updateMany({ role: 'instructor', approvalStatus: { $exists: false } }, { $set: { approvalStatus: 'pending' } });
      await User.syncIndexes();
      const { Course } = await import('./models/index.js');
      await Course.updateMany({ isFeatured: { $exists: false } }, { $set: { isFeatured: false } });
      await Course.syncIndexes();
      await Product.updateMany({ lowStockThreshold: { $exists: false } }, { $set: { lowStockThreshold: 5 } });
      await Product.updateMany({ salesCount: { $exists: false } }, { $set: { salesCount: 0 } });
      await Product.syncIndexes();
    } catch {}
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
