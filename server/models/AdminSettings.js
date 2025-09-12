import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  permissions: { type: Map, of: Boolean, default: {} }
}, { _id: false });

const adminSettingsSchema = new mongoose.Schema({
  roles: { type: [roleSchema], default: [] },
  general: { type: Map, of: mongoose.Schema.Types.Mixed },
  security: { type: Map, of: mongoose.Schema.Types.Mixed },
  notifications: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

adminSettingsSchema.index({ createdAt: -1 });

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
export default AdminSettings;


