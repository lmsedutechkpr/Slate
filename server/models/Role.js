import mongoose from 'mongoose';

const PermissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  actions: [{
    type: String,
    enum: ['read', 'create', 'update', 'delete', 'publish', 'manage', 'export', 'reset_password', 'ban_user', 'manage_inventory', 'issue_refunds', 'update_status']
  }]
});

const RoleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  },
  color: { 
    type: String, 
    default: '#3B82F6' 
  },
  icon: { 
    type: String, 
    default: 'shield' 
  },
  permissions: [PermissionSchema],
  isSystemRole: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  userCount: { 
    type: Number, 
    default: 0 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, {
  timestamps: true
});

// Index for better performance
RoleSchema.index({ name: 1 });
RoleSchema.index({ isSystemRole: 1 });
RoleSchema.index({ isActive: 1 });

// Virtual for permission count
RoleSchema.virtual('permissionCount').get(function() {
  return this.permissions.reduce((total, perm) => total + perm.actions.length, 0);
});

// Method to check if role has specific permission
RoleSchema.methods.hasPermission = function(module, action) {
  const permission = this.permissions.find(p => p.module === module);
  return permission && permission.actions.includes(action);
};

// Method to add permission
RoleSchema.methods.addPermission = function(module, action) {
  let permission = this.permissions.find(p => p.module === module);
  if (!permission) {
    permission = { module, actions: [] };
    this.permissions.push(permission);
  }
  if (!permission.actions.includes(action)) {
    permission.actions.push(action);
  }
  return this.save();
};

// Method to remove permission
RoleSchema.methods.removePermission = function(module, action) {
  const permission = this.permissions.find(p => p.module === module);
  if (permission) {
    permission.actions = permission.actions.filter(a => a !== action);
    if (permission.actions.length === 0) {
      this.permissions = this.permissions.filter(p => p.module !== module);
    }
  }
  return this.save();
};

// Static method to get system roles
RoleSchema.statics.getSystemRoles = function() {
  return this.find({ isSystemRole: true });
};

// Static method to get custom roles
RoleSchema.statics.getCustomRoles = function() {
  return this.find({ isSystemRole: false, isActive: true });
};

// Pre-save middleware to update user count
RoleSchema.pre('save', async function(next) {
  if (this.isModified('isActive') && !this.isActive) {
    // If role is being deactivated, reassign users to default role
    const User = mongoose.model('User');
    const defaultRole = await this.constructor.findOne({ name: 'Student', isSystemRole: true });
    if (defaultRole) {
      await User.updateMany(
        { role: this.name },
        { $set: { role: 'Student' } }
      );
    }
  }
  next();
});

export default mongoose.model('Role', RoleSchema);
