import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorRole: { type: String },
  actorUsername: { type: String },
  actorEmail: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  targetType: { type: String },
  targetId: { type: String },
  meta: { type: Object },
}, { timestamps: { createdAt: true, updatedAt: false } });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;


