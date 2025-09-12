import { Role, User, AuditLog } from '../models/index.js';

// Permission modules and actions configuration
export const PERMISSION_MODULES = {
  USER_MANAGEMENT: {
    name: 'User Management',
    description: 'Manage users, roles, and permissions',
    actions: ['read', 'create', 'update', 'delete', 'reset_password', 'ban_user']
  },
  INSTRUCTOR_MANAGEMENT: {
    name: 'Instructor Management', 
    description: 'Manage instructor accounts and assignments',
    actions: ['read', 'create', 'update', 'delete', 'assign_courses']
  },
  COURSE_MANAGEMENT: {
    name: 'Course Management',
    description: 'Create, edit, and manage courses',
    actions: ['read', 'create', 'update', 'delete', 'publish', 'manage_content']
  },
  STORE_MANAGEMENT: {
    name: 'Store Management',
    description: 'E-commerce administration',
    actions: ['read', 'create', 'update', 'delete', 'manage_inventory', 'issue_refunds', 'update_status']
  },
  PRODUCT_MANAGEMENT: {
    name: 'Product Management',
    description: 'Manage store products',
    actions: ['read', 'create', 'update', 'delete', 'manage_inventory']
  },
  ORDER_MANAGEMENT: {
    name: 'Order Management', 
    description: 'View and process orders',
    actions: ['read', 'update_status', 'issue_refunds', 'export']
  },
  INVENTORY_MANAGEMENT: {
    name: 'Inventory Management',
    description: 'Track and manage stock levels',
    actions: ['read', 'update', 'manage_inventory']
  },
  ANALYTICS: {
    name: 'Analytics',
    description: 'View system analytics and reports',
    actions: ['read', 'export', 'create_reports']
  },
  SYSTEM_SETTINGS: {
    name: 'System Settings',
    description: 'Configure system-wide settings',
    actions: ['read', 'update', 'manage_payment', 'configure_email', 'manage_integrations']
  },
  REPORTS: {
    name: 'Reports',
    description: 'Generate and manage reports',
    actions: ['read', 'create', 'export', 'schedule']
  }
};

// Get all roles with user counts
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true })
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .sort({ isSystemRole: -1, createdAt: -1 });

    // Get user counts for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({ role: role.name });
        return {
          ...role.toObject(),
          userCount
        };
      })
    );

    res.json({
      roles: rolesWithCounts,
      modules: PERMISSION_MODULES
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
};

// Get role by ID
export const getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const role = await Role.findById(roleId)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Get user count
    const userCount = await User.countDocuments({ role: role.name });

    res.json({
      ...role.toObject(),
      userCount
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch role',
      error: error.message
    });
  }
};

// Create new role
export const createRole = async (req, res) => {
  try {
    const { name, description, color, icon, permissions } = req.body;
    const adminId = req.user._id;

    // Check if role name already exists
    const existingRole = await Role.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingRole) {
      return res.status(400).json({ message: 'Role name already exists' });
    }

    const role = new Role({
      name,
      description,
      color: color || '#3B82F6',
      icon: icon || 'shield',
      permissions: permissions || [],
      createdBy: adminId,
      updatedBy: adminId
    });

    await role.save();

    // Log the action
    await AuditLog.create({
      action: 'create_role',
      performedBy: adminId,
      targetType: 'role',
      targetId: role._id,
      details: { roleName: name, permissionCount: permissions?.length || 0 }
    });

    res.status(201).json({
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create role',
      error: error.message
    });
  }
};

// Update role
export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, color, icon, permissions } = req.body;
    const adminId = req.user._id;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if it's a system role
    if (role.isSystemRole) {
      return res.status(400).json({ message: 'Cannot modify system roles' });
    }

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: roleId }
      });
      if (existingRole) {
        return res.status(400).json({ message: 'Role name already exists' });
      }
    }

    // Update role
    const updatedRole = await Role.findByIdAndUpdate(
      roleId,
      {
        name: name || role.name,
        description: description || role.description,
        color: color || role.color,
        icon: icon || role.icon,
        permissions: permissions || role.permissions,
        updatedBy: adminId
      },
      { new: true }
    );

    // Log the action
    await AuditLog.create({
      action: 'update_role',
      performedBy: adminId,
      targetType: 'role',
      targetId: roleId,
      details: { 
        roleName: updatedRole.name, 
        permissionCount: permissions?.length || 0,
        changes: { name, description, color, icon, permissions }
      }
    });

    res.json({
      message: 'Role updated successfully',
      role: updatedRole
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update role',
      error: error.message
    });
  }
};

// Delete role
export const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const adminId = req.user._id;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if it's a system role
    if (role.isSystemRole) {
      return res.status(400).json({ message: 'Cannot delete system roles' });
    }

    // Check if role has users assigned
    const userCount = await User.countDocuments({ role: role.name });
    if (userCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role. ${userCount} users are assigned to this role. Please reassign them first.` 
      });
    }

    // Soft delete
    await Role.findByIdAndUpdate(roleId, { isActive: false });

    // Log the action
    await AuditLog.create({
      action: 'delete_role',
      performedBy: adminId,
      targetType: 'role',
      targetId: roleId,
      details: { roleName: role.name }
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete role',
      error: error.message
    });
  }
};

// Update role permissions
export const updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { module, action, granted } = req.body;
    const adminId = req.user._id;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if it's a system role
    if (role.isSystemRole) {
      return res.status(400).json({ message: 'Cannot modify system role permissions' });
    }

    if (granted) {
      await role.addPermission(module, action);
    } else {
      await role.removePermission(module, action);
    }

    // Log the action
    await AuditLog.create({
      action: 'update_role_permissions',
      performedBy: adminId,
      targetType: 'role',
      targetId: roleId,
      details: { 
        roleName: role.name, 
        module, 
        action, 
        granted 
      }
    });

    res.json({
      message: 'Permission updated successfully',
      role
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update permissions',
      error: error.message
    });
  }
};

// Get users assigned to a role
export const getRoleUsers = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const users = await User.find({ role: role.name })
      .select('-password -refreshToken')
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ role: role.name });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch role users',
      error: error.message
    });
  }
};

// Initialize default system roles
export const initializeSystemRoles = async (req, res) => {
  try {
    const adminId = req.user._id;

    // Check if roles already exist
    const existingRoles = await Role.countDocuments();
    if (existingRoles > 0) {
      return res.json({ message: 'System roles already initialized' });
    }

    // Create system roles
    const systemRoles = [
      {
        name: 'Administrator',
        description: 'Full system access and control',
        color: '#DC2626',
        icon: 'shield',
        isSystemRole: true,
        permissions: [
          { module: 'USER_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'reset_password', 'ban_user'] },
          { module: 'INSTRUCTOR_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'assign_courses'] },
          { module: 'COURSE_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'publish', 'manage_content'] },
          { module: 'STORE_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'manage_inventory', 'issue_refunds', 'update_status'] },
          { module: 'PRODUCT_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'manage_inventory'] },
          { module: 'ORDER_MANAGEMENT', actions: ['read', 'update_status', 'issue_refunds', 'export'] },
          { module: 'INVENTORY_MANAGEMENT', actions: ['read', 'update', 'manage_inventory'] },
          { module: 'ANALYTICS', actions: ['read', 'export', 'create_reports'] },
          { module: 'SYSTEM_SETTINGS', actions: ['read', 'update', 'manage_payment', 'configure_email', 'manage_integrations'] },
          { module: 'REPORTS', actions: ['read', 'create', 'export', 'schedule'] }
        ],
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: 'Instructor',
        description: 'Can manage courses and students',
        color: '#2563EB',
        icon: 'users',
        isSystemRole: true,
        permissions: [
          { module: 'COURSE_MANAGEMENT', actions: ['read', 'create', 'update', 'manage_content'] },
          { module: 'ANALYTICS', actions: ['read'] },
          { module: 'REPORTS', actions: ['read', 'create'] }
        ],
        createdBy: adminId,
        updatedBy: adminId
      },
      {
        name: 'Student',
        description: 'Can access courses and learning materials',
        color: '#059669',
        icon: 'graduation-cap',
        isSystemRole: true,
        permissions: [],
        createdBy: adminId,
        updatedBy: adminId
      }
    ];

    await Role.insertMany(systemRoles);

    res.json({ message: 'System roles initialized successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to initialize system roles',
      error: error.message
    });
  }
};
